import { and, eq, sql } from 'drizzle-orm'
import { db, exigirBanco, schema } from '@/db'
import { ehDiaUtil } from '@/domain/feriados'
import { REGRAS_SVMA, calcularVencimento } from '@/domain/prazos'
import type { Processo } from '@/domain/processos'
import { eventoDoAto, prazoDoAto, vincularAto } from '@/domain/publicacoes'
import type { DataISO } from '@/lib/datas'
import { baixarEdicao } from '@/robo/doc-sp'
import { carregar } from './base'
import { hoje } from './hoje'
import { gravacoesDoEvento } from './processos'

export async function listarPublicacoes() {
  const { processos, clientes, publicacoes } = await carregar()

  const itens = publicacoes.atos.flatMap((ato) => {
    const vinculo = vincularAto(ato, processos, clientes)
    if (!vinculo) return []
    const evento = eventoDoAto(ato)
    const diasNoAto = prazoDoAto(ato)
    return [
      {
        ato,
        vinculo,
        evento,
        diasNoAto,
        cliente: clientes.find((c) => c.id === vinculo.clienteId)!,
        processo: processos.find((p) => p.id === vinculo.processoId),
        prazosSugeridos: REGRAS_SVMA.filter((regra) => regra.gatilho === evento).map((regra) => ({
          titulo: regra.titulo,
          tipo: regra.tipo,
          ...calcularVencimento(regra, ato.data, diasNoAto),
        })),
      },
    ]
  })

  return { edicao: publicacoes.edicao, itens }
}

export type PublicacaoNaCaixa = Awaited<ReturnType<typeof listarPublicacoes>>['itens'][number]

export async function obterPublicacao(id: string) {
  const { itens } = await listarPublicacoes()
  return itens.find((item) => item.ato.id === id)
}

const aindaNova = (id: string) => and(eq(schema.publicacoes.id, id), eq(schema.publicacoes.status, 'nova'))

/** Confirma o ato. Se a série do ato vira evento, lança o evento no processo (com o prazo escrito no ato) na mesma transação. */
export async function gravarConfirmacao(item: PublicacaoNaCaixa & { processo: Processo }) {
  exigirBanco()
  if (!item.evento) {
    await db.update(schema.publicacoes).set({ status: 'confirmada' }).where(aindaNova(item.ato.id))
    return
  }
  // Id fixo por ato: duas confirmações ao mesmo tempo gravam um evento só.
  const evento = { id: `diario-${item.ato.id}`, tipo: item.evento, data: item.ato.data, origem: 'diario' as const, diasNoAto: item.diasNoAto }
  await db.batch([
    ...gravacoesDoEvento(item.processo, evento, await hoje()),
    db.update(schema.publicacoes).set({ status: 'confirmada', eventoId: evento.id }).where(aindaNova(item.ato.id)),
  ])
}

/**
 * Lança o ato no processo que acabou de ser cadastrado a partir dele. Só quando o nº SEI do processo é o do ato:
 * é por ele que a caixa liga o ato ao processo nas próximas leituras. Devolve se lançou.
 * O processo vem de quem chama: no mesmo pedido, o `carregar()` ainda não tem o processo novo.
 */
export async function lancarNoProcessoNovo(atoId: string, processo: Processo) {
  const item = await obterPublicacao(atoId)
  if (!item || item.ato.status !== 'nova' || !item.ato.processo || item.ato.processo !== processo.numeroSei) return false
  await gravarConfirmacao({ ...item, processo })
  return true
}

export async function gravarDescarte(id: string, motivo: string) {
  exigirBanco()
  await db.update(schema.publicacoes).set({ status: 'descartada', motivo }).where(aindaNova(id))
}

/**
 * Baixa a edição do dia, grava na caixa de entrada os atos que se ligam a um cliente ou processo e registra a edição.
 * Rodar de novo não duplica (unique em data + documento). Falha do download lança erro; quem chama avisa.
 */
export async function importarEdicao(data: DataISO) {
  exigirBanco()
  const edicao = await baixarEdicao(data)
  if (!edicao) {
    // Dia útil sem edição costuma ser ponto facultativo (fora de feriados.ts), mas pode ser falha da fonte: fica registrado para conferir.
    if (ehDiaUtil(data)) {
      await db.insert(schema.edicoesDiario).values({ data, totalAtos: 0, atosSvma: 0, erro: 'O Diário Oficial não publicou edição neste dia útil.' }).onConflictDoNothing()
    }
    return undefined
  }

  const { processos, clientes } = await carregar()
  const nossos = edicao.atos.filter((ato) => vincularAto(ato, processos, clientes))
  const registro = { data, totalAtos: edicao.totalAtos, atosSvma: edicao.atos.length, erro: null }
  const gravarRegistro = db
    .insert(schema.edicoesDiario)
    .values(registro)
    .onConflictDoUpdate({ target: schema.edicoesDiario.data, set: { ...registro, processadaEm: sql`now()` } })

  if (nossos.length === 0) {
    await gravarRegistro
    return { atosSvma: edicao.atos.length, novos: 0 }
  }
  const [inseridos] = await db.batch([db.insert(schema.publicacoes).values(nossos).onConflictDoNothing().returning({ id: schema.publicacoes.id }), gravarRegistro])
  return { atosSvma: edicao.atos.length, novos: inseridos.length }
}

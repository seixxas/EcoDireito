import { and, eq } from 'drizzle-orm'
import { db, exigirBanco, schema } from '@/db'
import { REGRAS_SVMA, calcularVencimento } from '@/domain/prazos'
import type { Processo } from '@/domain/processos'
import { SERIE_PARA_EVENTO, extrairDiasDoTexto, vincularAto } from '@/domain/publicacoes'
import { carregar } from './base'
import { gravacoesDoEvento } from './processos'

export async function listarPublicacoes() {
  const { processos, clientes, publicacoes } = await carregar()

  const itens = publicacoes.atos.flatMap((ato) => {
    const vinculo = vincularAto(ato, processos, clientes)
    if (!vinculo) return []
    const evento = SERIE_PARA_EVENTO[ato.serie]
    const diasNoAto = extrairDiasDoTexto(ato.texto)
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
  const { hoje } = await carregar()
  if (!item.evento) {
    await db.update(schema.publicacoes).set({ status: 'confirmada' }).where(aindaNova(item.ato.id))
    return
  }
  const evento = { id: crypto.randomUUID(), tipo: item.evento, data: item.ato.data, origem: 'diario' as const, diasNoAto: item.diasNoAto }
  await db.batch([
    ...gravacoesDoEvento(item.processo, evento, hoje),
    db.update(schema.publicacoes).set({ status: 'confirmada', eventoId: evento.id }).where(aindaNova(item.ato.id)),
  ])
}

export async function gravarDescarte(id: string, motivo: string) {
  exigirBanco()
  await db.update(schema.publicacoes).set({ status: 'descartada', motivo }).where(aindaNova(id))
}

import { eq } from 'drizzle-orm'
import { db, exigirBanco, schema } from '@/db'
import { situacaoParcela } from '@/domain/financeiro/parcelas'
import { gerarPrazos, proximoPrazo, type Prazo } from '@/domain/prazos'
import { faseDepoisDoEvento, type Cliente, type Evento, type Processo } from '@/domain/processos'
import type { DataISO } from '@/lib/datas'
import { carregar } from './base'
import { hoje } from './hoje'

export type PrazoComProcesso = Prazo & { processo: Processo; cliente: Cliente }
export type DadosCliente = Omit<Cliente, 'id'>
export type DadosProcesso = Omit<Processo, 'id' | 'eventos'>

export async function listarClientes() {
  const { clientes, processos } = await carregar()
  return clientes.map((cliente) => ({ cliente, processos: processos.filter((p) => p.clienteId === cliente.id).length }))
}

export async function obterCliente(id: string) {
  const { clientes } = await carregar()
  return clientes.find((c) => c.id === id)
}

/** O vínculo com o Diário Oficial procura o processo pelo nº SEI, então ele não pode se repetir. */
export async function seiEmUso(numeroSei: string, exceto?: string) {
  const { processos } = await carregar()
  return processos.some((p) => p.numeroSei === numeroSei && p.id !== exceto)
}

export async function listarProcessos() {
  const { hoje, processos, clientes } = await carregar()
  return processos.map((processo) => {
    const prazos = gerarPrazos(processo)
    return { processo, cliente: clientes.find((c) => c.id === processo.clienteId)!, prazos, proximo: proximoPrazo(prazos, hoje) }
  })
}

export async function listarPrazos(): Promise<PrazoComProcesso[]> {
  const { processos, clientes } = await carregar()
  return processos
    .flatMap((processo) => {
      const cliente = clientes.find((c) => c.id === processo.clienteId)!
      return gerarPrazos(processo).map((prazo) => ({ ...prazo, processo, cliente }))
    })
    .sort((a, b) => a.vencimento.localeCompare(b.vencimento))
}

export async function obterProcesso(id: string) {
  const { hoje, processos, clientes, contratos, financeiro } = await carregar()
  const processo = processos.find((p) => p.id === id)
  if (!processo) return undefined
  const contrato = contratos.find((c) => c.processoId === id)
  const notas = financeiro.notas.filter((n) => n.processoId === id)
  return {
    processo,
    cliente: clientes.find((c) => c.id === processo.clienteId)!,
    prazos: gerarPrazos(processo),
    parcelas: (contrato?.parcelas ?? []).map((parcela) => ({ parcela, ...situacaoParcela(parcela, processo, notas, hoje) })),
  }
}

/** Parcelas cujo evento já aconteceu e ainda não viraram nota. */
export async function listarParcelasLiberadas() {
  const { hoje, processos, clientes, contratos, financeiro } = await carregar()
  return contratos.flatMap((contrato) => {
    const processo = processos.find((p) => p.id === contrato.processoId)!
    const cliente = clientes.find((c) => c.id === processo.clienteId)!
    return contrato.parcelas
      .map((parcela) => ({ parcela, processo, cliente, ...situacaoParcela(parcela, processo, financeiro.notas, hoje) }))
      .filter((item) => item.situacao === 'liberada')
  })
}

export async function gravarCliente(dados: DadosCliente, id?: string) {
  exigirBanco()
  const valores = { ...dados, grupo: dados.grupo ?? null }
  if (id) await db.update(schema.clientes).set(valores).where(eq(schema.clientes.id, id))
  else await db.insert(schema.clientes).values({ id: crypto.randomUUID(), ...valores })
}

/** Devolve o id do processo gravado. */
export async function gravarProcesso(dados: DadosProcesso, id?: string) {
  exigirBanco()
  const valores = { ...dados, numeroSimproc: dados.numeroSimproc ?? null, numeroTca: dados.numeroTca ?? null }
  if (id) {
    await db.update(schema.processos).set(valores).where(eq(schema.processos.id, id))
    return id
  }
  const novo = crypto.randomUUID()
  await db.insert(schema.processos).values({ id: novo, ...valores })
  return novo
}

/**
 * As gravações de um evento novo, para juntar num `db.batch`: o evento e a fase do processo. Os prazos saem do motor na leitura.
 * Id repetido não grava de novo: é o que impede o mesmo ato do Diário de virar dois eventos.
 */
export function gravacoesDoEvento(processo: Processo, evento: Evento, dia: DataISO) {
  return [
    db
      .insert(schema.eventos)
      .values({ ...evento, processoId: processo.id, diasNoAto: evento.diasNoAto ?? null })
      .onConflictDoNothing(),
    db
      .update(schema.processos)
      .set({ faseAtual: faseDepoisDoEvento(processo.faseAtual, evento, dia) })
      .where(eq(schema.processos.id, processo.id)),
  ] as const
}

export async function gravarEvento(processo: Processo, evento: Omit<Evento, 'id'>) {
  exigirBanco()
  await db.batch(gravacoesDoEvento(processo, { id: crypto.randomUUID(), ...evento }, await hoje()))
}

/** Apaga um evento lançado por engano. Se ele veio do Diário Oficial, o ato volta para a caixa de entrada. */
export async function removerEvento(id: string) {
  exigirBanco()
  await db.batch([
    db.update(schema.publicacoes).set({ status: 'nova', eventoId: null }).where(eq(schema.publicacoes.eventoId, id)),
    db.delete(schema.eventos).where(eq(schema.eventos.id, id)),
  ])
}

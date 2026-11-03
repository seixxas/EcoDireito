import { eq } from 'drizzle-orm'
import { db, exigirBanco, schema } from '@/db'
import { situacaoParcela } from '@/domain/financeiro/parcelas'
import { gerarPrazos, proximoPrazo, type Prazo } from '@/domain/prazos'
import { faseDepoisDoEvento, type Cliente, type Evento, type Processo } from '@/domain/processos'
import { parcelasDaProposta, propostaRecusada, situacaoDaProposta, type Proposta } from '@/domain/propostas'
import type { DataISO } from '@/lib/datas'
import { somar, type Centavos } from '@/lib/dinheiro'
import { carregar } from './base'
import { hoje } from './hoje'

export type PrazoComProcesso = Prazo & { processo: Processo; cliente: Cliente }
export type DadosCliente = Omit<Cliente, 'id'>
export type DadosProcesso = Omit<Processo, 'id' | 'eventos'>

/** Proposta recusada não conta como processo do cliente. */
export async function listarClientes() {
  const { clientes, processos } = await carregar()
  return clientes.map((cliente) => ({ cliente, processos: processos.filter((p) => p.clienteId === cliente.id && !propostaRecusada(p)).length }))
}

export async function obterCliente(id: string) {
  const { clientes } = await carregar()
  return clientes.find((c) => c.id === id)
}

/** O vínculo com o Diário Oficial procura o processo pelo nº SEI, então ele não pode se repetir. Sem SEI (antes da autuação) não conflita. */
export async function seiEmUso(numeroSei: string | undefined, exceto?: string) {
  if (!numeroSei) return false
  const { processos } = await carregar()
  return processos.some((p) => p.numeroSei === numeroSei && p.id !== exceto)
}

/** Proposta recusada sai da lista de processos; ela fica no Comercial. */
export async function listarProcessos() {
  const { hoje, processos, clientes } = await carregar()
  return processos.filter((processo) => !propostaRecusada(processo)).map((processo) => {
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
  const { hoje, processos, clientes, contratos, propostas, financeiro } = await carregar()
  const processo = processos.find((p) => p.id === id)
  if (!processo) return undefined
  const contrato = contratos.find((c) => c.processoId === id)
  const notas = financeiro.notas.filter((n) => n.processoId === id)
  return {
    processo,
    cliente: clientes.find((c) => c.id === processo.clienteId)!,
    prazos: gerarPrazos(processo),
    parcelas: (contrato?.parcelas ?? []).map((parcela) => ({ parcela, ...situacaoParcela(parcela, processo, notas, hoje) })),
    proposta: propostas.find((p) => p.processoId === id),
    situacaoProposta: situacaoDaProposta(processo, hoje),
  }
}

/** O funil do Comercial: cada proposta com a situação e o valor (a soma das parcelas, para quem vê o financeiro). */
export async function listarPropostas() {
  const { hoje, processos, clientes, contratos, propostas } = await carregar()
  return propostas.flatMap((proposta) => {
    const processo = processos.find((p) => p.id === proposta.processoId)
    if (!processo) return []
    const parcelas = contratos.find((c) => c.processoId === processo.id)?.parcelas
    return [
      {
        proposta,
        processo,
        cliente: clientes.find((c) => c.id === processo.clienteId)!,
        valor: parcelas ? somar(parcelas.map((p) => p.valor)) : undefined,
        situacao: situacaoDaProposta(processo, hoje),
      },
    ]
  })
}

export type DadosProposta = Pick<Processo, 'clienteId' | 'empreendimento' | 'endereco' | 'responsavel' | 'servico'> & Omit<Proposta, 'processoId' | 'criadaEm'> & { valor: Centavos }

/** Proposta nova: o processo na fase 1 (sem nº SEI), o texto da proposta e o contrato com as parcelas do serviço, numa transação. Devolve o id. */
export async function gravarProposta({ valor, escopo, validadeDias, ...processo }: DadosProposta) {
  exigirBanco()
  const id = crypto.randomUUID()
  const contratoId = crypto.randomUUID()
  await db.batch([
    db.insert(schema.processos).values({ id, ...processo, faseAtual: 1 }),
    db.insert(schema.propostas).values({ processoId: id, escopo, validadeDias, criadaEm: await hoje() }),
    db.insert(schema.contratos).values({ id: contratoId, processoId: id }),
    db
      .insert(schema.parcelas)
      .values(parcelasDaProposta(processo.servico, valor).map((parcela, i) => ({ id: crypto.randomUUID(), contratoId, ordem: i + 1, ...parcela }))),
  ])
  return id
}

export async function alterarProposta(processoId: string, dados: Pick<Proposta, 'escopo' | 'validadeDias'>) {
  exigirBanco()
  await db.update(schema.propostas).set(dados).where(eq(schema.propostas.processoId, processoId))
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
  const valores = { ...dados, numeroSei: dados.numeroSei ?? null, numeroSimproc: dados.numeroSimproc ?? null, numeroTca: dados.numeroTca ?? null }
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
      .values({ ...evento, processoId: processo.id, diasNoAto: evento.diasNoAto ?? null, observacao: evento.observacao ?? null })
      .onConflictDoNothing(),
    db
      .update(schema.processos)
      .set({ faseAtual: faseDepoisDoEvento(processo.faseAtual, evento, dia) })
      .where(eq(schema.processos.id, processo.id)),
  ] as const
}

/** `numeroSei` vem junto com a autuação, quando o processo ainda não tinha. */
export async function gravarEvento(processo: Processo, evento: Omit<Evento, 'id'>, numeroSei?: string) {
  exigirBanco()
  const gravacoes = gravacoesDoEvento(processo, { id: crypto.randomUUID(), ...evento }, await hoje())
  if (!numeroSei) return void (await db.batch(gravacoes))
  await db.batch([...gravacoes, db.update(schema.processos).set({ numeroSei }).where(eq(schema.processos.id, processo.id))])
}

/** Apaga um evento lançado por engano. Se ele veio do Diário Oficial, o ato volta para a caixa de entrada. */
export async function removerEvento(id: string) {
  exigirBanco()
  await db.batch([
    db.update(schema.publicacoes).set({ status: 'nova', eventoId: null }).where(eq(schema.publicacoes.eventoId, id)),
    db.delete(schema.eventos).where(eq(schema.eventos.id, id)),
  ])
}

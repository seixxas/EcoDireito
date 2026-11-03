import { situacaoParcela } from '@/domain/financeiro/parcelas'
import { gerarPrazos, proximoPrazo, type Prazo } from '@/domain/prazos'
import type { Cliente, Processo } from '@/domain/processos'
import { carregar } from './base'

export type PrazoComProcesso = Prazo & { processo: Processo; cliente: Cliente }

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

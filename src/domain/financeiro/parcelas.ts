import type { DataISO } from '@/lib/datas'
import type { Centavos } from '@/lib/dinheiro'
import type { Processo, TipoEvento } from '../processos'
import { situacaoDaProposta } from '../propostas'
import { notaDaParcela, situacaoNota, type NotaFiscal } from './notas'

/** Parcela de contrato: nasce quando o evento do processo acontece. */
export type Parcela = {
  id: string
  contratoId: string
  descricao: string
  valor: Centavos
  gatilho: TipoEvento
}

export type Contrato = {
  id: string
  processoId: string
  parcelas: Parcela[]
}

/**
 * O contrato nasce com a proposta (as parcelas são o preço dela), mas só conta como contratado depois do aceite.
 * Segue a situação da proposta do Comercial, para as duas telas nunca discordarem (recusa vale mais que aceite).
 */
export type SituacaoDoContrato = 'fechado' | 'proposta' | 'recusada'

export function situacaoDoContrato(processo: Processo, hoje: DataISO): SituacaoDoContrato {
  const { estado } = situacaoDaProposta(processo, hoje)
  return estado === 'aprovada' ? 'fechado' : estado === 'recusada' ? 'recusada' : 'proposta'
}

export type SituacaoParcela = 'aguardando' | 'liberada' | 'faturada' | 'recebida'

export function situacaoParcela(parcela: Parcela, processo: Processo, notas: NotaFiscal[], hoje: DataISO) {
  const nota = notaDaParcela(parcela.id, notas)
  const evento = processo.eventos.find((e) => e.tipo === parcela.gatilho && e.data <= hoje)
  let situacao: SituacaoParcela = 'aguardando'
  if (nota) situacao = situacaoNota(nota, hoje) === 'recebida' ? 'recebida' : 'faturada'
  else if (evento) situacao = 'liberada'
  return { situacao, nota, liberadaEm: evento?.data }
}

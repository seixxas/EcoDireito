import type { DataISO } from '@/lib/datas'
import type { Centavos } from '@/lib/dinheiro'
import type { Processo, TipoEvento } from '../processos'
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

export type SituacaoParcela = 'aguardando' | 'liberada' | 'faturada' | 'recebida'

export function situacaoParcela(parcela: Parcela, processo: Processo, notas: NotaFiscal[], hoje: DataISO) {
  const nota = notaDaParcela(parcela.id, notas)
  const evento = processo.eventos.find((e) => e.tipo === parcela.gatilho && e.data <= hoje)
  let situacao: SituacaoParcela = 'aguardando'
  if (nota) situacao = situacaoNota(nota, hoje) === 'recebida' ? 'recebida' : 'faturada'
  else if (evento) situacao = 'liberada'
  return { situacao, nota, liberadaEm: evento?.data }
}

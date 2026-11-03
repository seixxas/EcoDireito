import { mesesDaCompetencia, type Lancamento } from '@/domain/financeiro/lancamentos'
import { formatarMes } from '@/lib/formatar'

/** A mesma explicação na lista, na tela do lançamento e nos formulários. */
export const EXPLICACAO_COMPETENCIA =
  'Competência é o mês a que o gasto se refere, quando não é o mês do pagamento (ex.: o DAS pago em novembro é do faturamento de outubro). A DRE por competência usa esse mês.'

export const DICA_COMPETENCIA = 'Mês a que se refere. Vazio = o mês do pagamento; mude só se for outro (ex.: DAS de outubro pago em novembro).'

/** "out/26 · mês anterior ao pagamento". Vazio quando a competência é o próprio mês do pagamento. */
export function textoDaCompetencia(lancamento: Pick<Lancamento, 'data' | 'competencia'>) {
  const meses = mesesDaCompetencia(lancamento)
  if (meses === 0) return undefined
  const distancia =
    meses === -1 ? 'mês anterior ao pagamento' : meses === 1 ? 'mês seguinte ao pagamento' : `${Math.abs(meses)} meses ${meses < 0 ? 'antes' : 'depois'} do pagamento`
  return `${formatarMes(lancamento.competencia)} · ${distancia}`
}

import type { DataISO } from '@/lib/datas'
import type { Centavos } from '@/lib/dinheiro'
import type { ContaId } from './plano-de-contas'

/** Uma linha do extrato, já classificada. */
export type Lancamento = {
  id: string
  /** Data em que o dinheiro entrou ou saiu (caixa). */
  data: DataISO
  /** Mês a que pertence ('AAAA-MM'), para a DRE por competência. */
  competencia: string
  descricao: string
  contaId: ContaId
  /** Positivo = entrada, negativo = saída. */
  valor: Centavos
  processoId?: string
  notaId?: string
}

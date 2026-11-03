import { mesDe, type DataISO } from '@/lib/datas'
import type { Centavos } from '@/lib/dinheiro'
import type { Regime } from './dre'
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
  /** O que a descrição do banco não diz (ex.: "festa de fim de ano"). */
  observacao?: string
}

/** Só o realizado entra como lançamento; o previsto vem da projeção do fluxo. */
export function errosDoLancamento(lancamento: Omit<Lancamento, 'id'>, hoje: DataISO): Record<string, string> {
  const erros: Record<string, string> = {}
  if (lancamento.valor === 0) erros.valor = 'Informe um valor maior que zero'
  if (lancamento.data > hoje) erros.data = 'Lance só o que já aconteceu'
  return erros
}

export type EdicaoLancamento = Pick<Lancamento, 'descricao' | 'contaId' | 'competencia' | 'processoId' | 'observacao'>

/**
 * O que a edição pode mudar. Data e valor vêm do banco (ou da nota) e não mudam.
 * O lançamento de uma nota só aceita a observação: o resto é refeito pelo recebimento da nota.
 */
export function alteracoesDoLancamento(lancamento: Lancamento, edicao: EdicaoLancamento): Partial<EdicaoLancamento> {
  const observacao = edicao.observacao?.trim() || undefined
  if (lancamento.notaId) return { observacao }
  return {
    descricao: edicao.descricao,
    contaId: edicao.contaId,
    competencia: edicao.competencia || mesDe(lancamento.data),
    // A chave fica mesmo vazia: tirar o processo também é alteração.
    processoId: edicao.processoId,
    observacao,
  }
}

/** Mês em que o lançamento cai: pela data do dinheiro (caixa) ou pela competência. */
export function mesDoLancamento(lancamento: Lancamento, regime: Regime) {
  return regime === 'competencia' ? lancamento.competencia : mesDe(lancamento.data)
}

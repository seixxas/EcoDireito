import type { DataISO } from '@/lib/datas'
import { reais, somar, type Centavos } from '@/lib/dinheiro'
import type { Processo, Servico } from '../processos'
import type { Lancamento } from './lancamentos'
import type { NotaFiscal } from './notas'
import type { ContaId } from './plano-de-contas'

/**
 * Lucratividade por projeto (processo). Contrato, faturado, recebido e custos diretos vêm das notas e dos lançamentos
 * ligados ao processo. A equipe ainda não registra horas: o custo dela é SIMULADO (`horasEstimadas` × `CUSTO_HORA_EQUIPE`).
 */

/** Custo de uma hora da equipe técnica (simulado). */
export const CUSTO_HORA_EQUIPE = reais(95)

/** Horas da equipe por R$ 1.000 faturados (simulado): manejo tem mais campo. */
const HORAS_POR_MIL: Record<Servico, number> = { licenciamento: 1.5, manejo: 2.5 }

/** De 0,7 a 1,3, fixo para cada processo (tirado do id, sem sorteio): uns projetos dão mais trabalho que outros. */
function variacao(processoId: string) {
  let h = 0
  for (const letra of processoId) h = (h * 31 + letra.charCodeAt(0)) % 1_000
  return 0.7 + (h % 61) / 100
}

/** Horas estimadas da equipe no projeto (simulação, até existir o registro de horas). */
export function horasEstimadas(processo: Pick<Processo, 'id' | 'servico'>, faturado: Centavos) {
  return Math.round((faturado / reais(1_000)) * HORAS_POR_MIL[processo.servico] * variacao(processo.id))
}

export type SituacaoMargem = 'boa' | 'atencao' | 'ruim'

export const MARGEM_BOA = 0.4
export const MARGEM_MINIMA = 0.2

export function situacaoDaMargem(margem: number): SituacaoMargem {
  return margem >= MARGEM_BOA ? 'boa' : margem >= MARGEM_MINIMA ? 'atencao' : 'ruim'
}

export type Lucratividade = {
  contratado: Centavos
  faturado: Centavos
  recebido: Centavos
  /** Saídas ligadas ao processo, por conta, em valor positivo, da maior para a menor. */
  custosPorConta: { contaId: ContaId; valor: Centavos }[]
  custosDiretos: Centavos
  horas: number
  custoEquipe: Centavos
  custoTotal: Centavos
  /** Sem faturamento ainda, não há margem. */
  margem?: Centavos
  /** Fração do faturado (0,35 = 35%). */
  margemPct?: number
  situacao?: SituacaoMargem
}

export function lucratividade(entrada: {
  processo: Pick<Processo, 'id' | 'servico'>
  contratado: Centavos
  notas: NotaFiscal[]
  lancamentos: Lancamento[]
  hoje: DataISO
}): Lucratividade {
  const { processo, contratado, hoje } = entrada
  const notas = entrada.notas.filter((n) => n.processoId === processo.id && !n.cancelada)
  const faturado = somar(notas.map((n) => n.valor))
  const recebido = somar(notas.map((n) => (n.recebimento && n.recebimento.data <= hoje ? n.recebimento.valor : 0)))

  const porConta = new Map<ContaId, Centavos>()
  for (const l of entrada.lancamentos) if (l.processoId === processo.id && l.valor < 0) porConta.set(l.contaId, (porConta.get(l.contaId) ?? 0) - l.valor)
  const custosPorConta = [...porConta].map(([contaId, valor]) => ({ contaId, valor })).sort((a, b) => b.valor - a.valor)
  const custosDiretos = somar(custosPorConta.map((c) => c.valor))

  const horas = horasEstimadas(processo, faturado)
  const custoEquipe = horas * CUSTO_HORA_EQUIPE
  const custoTotal = custosDiretos + custoEquipe
  if (!faturado) return { contratado, faturado, recebido, custosPorConta, custosDiretos, horas, custoEquipe, custoTotal }
  const margem = faturado - custoTotal
  return { contratado, faturado, recebido, custosPorConta, custosDiretos, horas, custoEquipe, custoTotal, margem, margemPct: margem / faturado, situacao: situacaoDaMargem(margem / faturado) }
}

/** Da maior margem para a menor; sem faturamento por último (pelo contrato). */
export function porMargem<T extends Lucratividade>(a: T, b: T) {
  if (a.margemPct === undefined || b.margemPct === undefined) return (a.margemPct === undefined ? 1 : 0) - (b.margemPct === undefined ? 1 : 0) || b.contratado - a.contratado
  return b.margemPct - a.margemPct
}

/** Margem média ponderada pelo faturado, e os extremos, só entre projetos que já faturaram. */
export function resumoDaLucratividade<T extends Lucratividade>(projetos: T[]) {
  const comMargem = projetos.filter((p) => p.margemPct !== undefined).sort(porMargem)
  const receita = somar(comMargem.map((p) => p.faturado))
  const custo = somar(comMargem.map((p) => p.custoTotal))
  return {
    receita,
    custo,
    margem: receita - custo,
    margemPct: receita ? (receita - custo) / receita : undefined,
    melhor: comMargem[0],
    pior: comMargem.at(-1),
  }
}

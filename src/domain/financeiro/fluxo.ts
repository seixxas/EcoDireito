import { inicioDaSemana, mesDe, somarDias, somarMeses, type DataISO } from '@/lib/datas'
import { somar, type Centavos } from '@/lib/dinheiro'
import type { Lancamento } from './lancamentos'
import { saldoAReceber, type NotaFiscal } from './notas'

export type Movimento = {
  data: DataISO
  descricao: string
  /** Positivo = entrada, negativo = saída. */
  valor: Centavos
  origem: 'nota' | 'parcela' | 'recorrente'
}

/** Despesa fixa que se repete todo mês no mesmo dia. */
export type Recorrente = { descricao: string; valor: Centavos; dia: number }

/** Dias entre liberar uma parcela e o dinheiro entrar (emitir a nota + prazo do cliente). */
export const DIAS_PARCELA_ATE_RECEBER = 25

export function movimentosPrevistos(entrada: {
  hoje: DataISO
  ate: DataISO
  notas: NotaFiscal[]
  parcelasLiberadas: { descricao: string; valor: Centavos }[]
  recorrentes: Recorrente[]
}): Movimento[] {
  const { hoje, ate, notas, parcelasLiberadas, recorrentes } = entrada
  const movimentos: Movimento[] = []

  // Notas atrasadas ficam fora: a projeção é conservadora.
  for (const nota of notas) {
    const saldo = saldoAReceber(nota, hoje)
    if (saldo > 0 && nota.previsao >= hoje && nota.previsao <= ate) {
      movimentos.push({ data: nota.previsao, descricao: `NF ${nota.numero} · ${nota.descricao}`, valor: saldo, origem: 'nota' })
    }
  }

  for (const parcela of parcelasLiberadas) {
    movimentos.push({ data: somarDias(hoje, DIAS_PARCELA_ATE_RECEBER), descricao: parcela.descricao, valor: parcela.valor, origem: 'parcela' })
  }

  for (let mes = `${mesDe(hoje)}-01`; mes <= ate; mes = somarMeses(mes, 1)) {
    for (const recorrente of recorrentes) {
      const data = somarDias(mes, recorrente.dia - 1)
      if (mesDe(data) === mesDe(mes) && data >= hoje && data <= ate) {
        movimentos.push({ data, descricao: recorrente.descricao, valor: recorrente.valor, origem: 'recorrente' })
      }
    }
  }

  return movimentos.sort((a, b) => a.data.localeCompare(b.data))
}

export type SemanaFluxo = {
  inicio: DataISO
  fim: DataISO
  entradas: Centavos
  saidas: Centavos
  saldoFinal: Centavos
  movimentos: Movimento[]
}

export function projetarSemanas(saldoInicial: Centavos, hoje: DataISO, movimentos: Movimento[], semanas: number): SemanaFluxo[] {
  const resultado: SemanaFluxo[] = []
  let saldo = saldoInicial
  for (let i = 0; i < semanas; i++) {
    const inicio = somarDias(inicioDaSemana(hoje), 7 * i)
    const fim = somarDias(inicio, 6)
    const daSemana = movimentos.filter((m) => m.data >= inicio && m.data <= fim)
    const entradas = somar(daSemana.filter((m) => m.valor > 0).map((m) => m.valor))
    const saidas = somar(daSemana.filter((m) => m.valor < 0).map((m) => m.valor))
    saldo += entradas + saidas
    resultado.push({ inicio, fim, entradas, saidas, saldoFinal: saldo, movimentos: daSemana })
  }
  return resultado
}

export function fluxoMensal(lancamentos: Lancamento[], meses: string[], saldoInicial: Centavos) {
  let saldo = saldoInicial
  return meses.map((mes) => {
    const doMes = lancamentos.filter((l) => mesDe(l.data) === mes)
    const entradas = somar(doMes.filter((l) => l.valor > 0).map((l) => l.valor))
    const saidas = somar(doMes.filter((l) => l.valor < 0).map((l) => l.valor))
    saldo += entradas + saidas
    return { mes, entradas, saidas, saldo }
  })
}

import { diaDaSemana, type DataISO } from './datas'
import type { Centavos } from './dinheiro'

const moeda = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })
const moedaCompacta = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
  notation: 'compact',
  maximumFractionDigits: 1,
})
const percentual = new Intl.NumberFormat('pt-BR', { style: 'percent', maximumFractionDigits: 1 })

const DIAS = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb']
const MESES = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez']

export function brl(valor: Centavos) {
  return moeda.format(valor / 100)
}

/** R$ 1,2 mi — para gráficos e KPIs. */
export function brlCompacto(valor: Centavos) {
  return moedaCompacta.format(valor / 100)
}

export function formatarPercentual(fracao: number) {
  return percentual.format(fracao)
}

/** 03/11/2026 */
export function formatarData(data: DataISO) {
  return `${data.slice(8, 10)}/${data.slice(5, 7)}/${data.slice(0, 4)}`
}

/** 03/11 */
export function formatarDataCurta(data: DataISO) {
  return `${data.slice(8, 10)}/${data.slice(5, 7)}`
}

/** ter, 03/11 */
export function formatarDiaEData(data: DataISO) {
  return `${DIAS[diaDaSemana(data)]}, ${formatarDataCurta(data)}`
}

/** 'AAAA-MM' → out/26 */
export function formatarMes(mes: string) {
  return `${MESES[Number(mes.slice(5, 7)) - 1]}/${mes.slice(2, 4)}`
}

/** "em 6 dias", "hoje", "há 2 dias" */
export function formatarDistancia(dias: number) {
  if (dias === 0) return 'hoje'
  if (dias === 1) return 'amanhã'
  if (dias === -1) return 'ontem'
  return dias > 0 ? `em ${dias} dias` : `há ${-dias} dias`
}

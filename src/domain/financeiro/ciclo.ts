import { mesDe, type DataISO } from '@/lib/datas'
import type { Centavos } from '@/lib/dinheiro'
import { brl, contar, formatarData, juntar } from '@/lib/formatar'
import { diasDeAtraso, saldoAReceber, situacaoNota, valorLiquido, type NotaFiscal } from './notas'

/** As abas do Faturamento, na ordem do ciclo: da parcela liberada ao dinheiro na conta. */
export const ABAS_DO_CICLO = {
  'a-faturar': 'A faturar',
  'a-vencer': 'A vencer',
  hoje: 'Vencem hoje',
  atrasadas: 'Atrasadas',
  recebidas: 'Recebidas',
  todas: 'Todas',
} as const

export type AbaDoCiclo = keyof typeof ABAS_DO_CICLO

export function ehAbaDoCiclo(valor: string | undefined): valor is AbaDoCiclo {
  return valor !== undefined && Object.hasOwn(ABAS_DO_CICLO, valor)
}

/** Só estas duas abas olham o mês; as outras mostram o estado de agora. */
export function abaUsaMes(aba: AbaDoCiclo) {
  return aba === 'recebidas' || aba === 'todas'
}

/**
 * A aba de estado da nota, que é uma só. Cancelada não tem aba (só aparece em Todas).
 * Recebida em parte continua em aberto: segue a previsão até o saldo acabar, então nunca aparece em Recebidas.
 */
export function abaDaNota(nota: NotaFiscal, hoje: DataISO): Exclude<AbaDoCiclo, 'a-faturar' | 'todas'> | undefined {
  const situacao = situacaoNota(nota, hoje)
  if (situacao === 'cancelada') return undefined
  if (situacao === 'recebida') return 'recebidas'
  if (nota.previsao < hoje) return 'atrasadas'
  return nota.previsao === hoje ? 'hoje' : 'a-vencer'
}

type ComNota = { nota: NotaFiscal }

const porPrevisao = (a: ComNota, b: ComNota) => a.nota.previsao.localeCompare(b.nota.previsao) || a.nota.numero - b.nota.numero

/** As notas de cada aba, na ordem da tabela. `mes` ('AAAA-MM') vale só para Recebidas e Todas; sem ele, todos os meses. */
export function notasPorAba<T extends ComNota>(itens: T[], hoje: DataISO, mes?: string) {
  const doMes = (data: DataISO) => !mes || mesDe(data) === mes
  const naAba = (aba: ReturnType<typeof abaDaNota>) => itens.filter(({ nota }) => abaDaNota(nota, hoje) === aba)
  return {
    'a-vencer': naAba('a-vencer').sort(porPrevisao),
    hoje: naAba('hoje').sort(porPrevisao),
    atrasadas: naAba('atrasadas').sort(porPrevisao),
    recebidas: naAba('recebidas')
      .filter(({ nota }) => doMes(nota.recebimento!.data))
      .sort((a, b) => b.nota.recebimento!.data.localeCompare(a.nota.recebimento!.data) || b.nota.numero - a.nota.numero),
    todas: itens.filter(({ nota }) => doMes(nota.emissao)).sort((a, b) => b.nota.numero - a.nota.numero),
  }
}

/** O que a nota soma no valor da aba: o que falta receber, o que entrou ou, em Todas, o líquido (cancelada não soma). */
export function valorNaAba(aba: Exclude<AbaDoCiclo, 'a-faturar'>, nota: NotaFiscal, hoje: DataISO): Centavos {
  if (aba === 'recebidas') return nota.recebimento?.valor ?? 0
  if (aba === 'todas') return nota.cancelada ? 0 : valorLiquido(nota)
  return saldoAReceber(nota, hoje)
}

/** Sem `?aba=`, abre a primeira que tem o que mostrar. */
export function primeiraAbaComItens(quantidades: Record<AbaDoCiclo, number>): AbaDoCiclo {
  return (Object.keys(ABAS_DO_CICLO) as AbaDoCiclo[]).find((aba) => quantidades[aba] > 0) ?? 'todas'
}

export const FAIXAS_DE_ATRASO = [
  { id: '1-15', rotulo: '1 a 15 dias', de: 1, ate: 15 },
  { id: '16-30', rotulo: '16 a 30 dias', de: 16, ate: 30 },
  { id: '31-60', rotulo: '31 a 60 dias', de: 31, ate: 60 },
  { id: '60+', rotulo: 'Mais de 60 dias', de: 61, ate: Infinity },
]

export type FaixaDeAtraso = (typeof FAIXAS_DE_ATRASO)[number]

export function naFaixa(nota: NotaFiscal, faixa: FaixaDeAtraso, hoje: DataISO) {
  const atraso = diasDeAtraso(nota, hoje)
  return atraso >= faixa.de && atraso <= faixa.ate
}

export const ORDENS_DAS_ATRASADAS = { atraso: 'Mais atrasadas', saldo: 'Maior saldo' } as const

export type OrdemDasAtrasadas = keyof typeof ORDENS_DAS_ATRASADAS

export function ordenarAtrasadas<T extends ComNota>(itens: T[], ordem: OrdemDasAtrasadas, hoje: DataISO) {
  if (ordem === 'atraso') return [...itens].sort(porPrevisao)
  return [...itens].sort((a, b) => saldoAReceber(b.nota, hoje) - saldoAReceber(a.nota, hoje) || porPrevisao(a, b))
}

/**
 * O que o formulário de recebimento já traz. A nota guarda um recebimento só e gravar de novo substitui o anterior:
 * na recebida em parte, sugerir o saldo apagaria o que já entrou, então ela traz o que está gravado.
 */
export function recebimentoSugerido(nota: NotaFiscal, hoje: DataISO) {
  return nota.recebimento ?? { data: hoje, valor: saldoAReceber(nota, hoje) }
}

/** Mensagem pronta para copiar. Só existe para nota em aberto. */
export function mensagemDeCobranca(nota: NotaFiscal, cliente: string, hoje: DataISO) {
  const aba = abaDaNota(nota, hoje)
  if (!aba || aba === 'recebidas') return undefined
  const valor = `${situacaoNota(nota, hoje) === 'parcial' ? 'saldo' : 'valor'} de ${brl(saldoAReceber(nota, hoje))}`
  const quando =
    aba === 'atrasadas'
      ? `venceu em ${formatarData(nota.previsao)} e está com ${contar(diasDeAtraso(nota, hoje), 'dia', 'dias')} de atraso`
      : aba === 'hoje'
        ? 'vence hoje'
        : `vence em ${formatarData(nota.previsao)}`
  return [
    'Olá, tudo bem?',
    `Sobre a NF ${nota.numero}, de ${cliente}: o ${valor} ${quando}.`,
    'Pode nos confirmar a data do pagamento?',
    'Agradecemos desde já.\nEco Direito Ambiental',
  ].join('\n\n')
}

/** A frase do topo: o que pede ação agora. */
export function fraseDoCiclo(quantidades: Record<AbaDoCiclo, number>, busca?: string) {
  const partes = [
    quantidades['a-faturar'] && contar(quantidades['a-faturar'], 'parcela para faturar', 'parcelas para faturar'),
    quantidades.hoje && contar(quantidades.hoje, 'nota vence hoje', 'notas vencem hoje'),
    quantidades.atrasadas && contar(quantidades.atrasadas, 'nota atrasada', 'notas atrasadas'),
  ].filter((parte): parte is string => Boolean(parte))
  const frase = partes.length ? juntar(partes) : 'nada para faturar ou cobrar agora'
  return busca ? `Com “${busca}”: ${frase}.` : `${frase.charAt(0).toUpperCase()}${frase.slice(1)}.`
}

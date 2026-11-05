import { diasEntre, type DataISO } from '@/lib/datas'
import { somar, type Centavos } from '@/lib/dinheiro'
import type { Processo } from '../processos'

export const ALIQUOTA_ISS = 0.05
/** Retenção na fonte que alguns clientes fazem (5,5% nas planilhas de 2026). */
export const ALIQUOTA_RETENCAO = 0.055
/** Previsão sugerida para uma nota nova. A mediana real até receber é de 17 dias. */
export const DIAS_PARA_RECEBER = 15

export type NotaFiscal = {
  id: string
  numero: number
  emissao: DataISO
  clienteId: string
  processoId?: string
  parcelaId?: string
  descricao: string
  valor: Centavos
  iss: Centavos
  /** Imposto retido pelo cliente na fonte (o cliente paga menos). */
  retencao: Centavos
  previsao: DataISO
  recebimento?: { data: DataISO; valor: Centavos }
  cancelada?: boolean
}

export type SituacaoNota = 'cancelada' | 'recebida' | 'parcial' | 'atrasada' | 'a_receber'

export function valorLiquido(nota: NotaFiscal): Centavos {
  return nota.valor - nota.retencao
}

function recebidoAte(nota: NotaFiscal, hoje: DataISO): Centavos {
  return nota.recebimento && nota.recebimento.data <= hoje ? nota.recebimento.valor : 0
}

export function situacaoNota(nota: NotaFiscal, hoje: DataISO): SituacaoNota {
  if (nota.cancelada) return 'cancelada'
  const recebido = recebidoAte(nota, hoje)
  if (recebido > 0) return recebido < valorLiquido(nota) - 100 ? 'parcial' : 'recebida'
  return nota.previsao < hoje ? 'atrasada' : 'a_receber'
}

export function saldoAReceber(nota: NotaFiscal, hoje: DataISO): Centavos {
  if (nota.cancelada) return 0
  return Math.max(0, valorLiquido(nota) - recebidoAte(nota, hoje))
}

export function diasDeAtraso(nota: NotaFiscal, hoje: DataISO) {
  return Math.max(0, diasEntre(nota.previsao, hoje))
}

export function resumoNotas(notas: NotaFiscal[], hoje: DataISO) {
  const validas = notas.filter((nota) => !nota.cancelada)
  const atrasadas = validas.filter((nota) => saldoAReceber(nota, hoje) > 0 && nota.previsao < hoje)
  const prazos = validas
    .filter((nota) => nota.recebimento && nota.recebimento.data <= hoje)
    .map((nota) => diasEntre(nota.emissao, nota.recebimento!.data))
    .sort((a, b) => a - b)

  return {
    quantidade: validas.length,
    faturado: somar(validas.map((nota) => nota.valor)),
    recebido: somar(validas.map((nota) => recebidoAte(nota, hoje))),
    aReceber: somar(validas.map((nota) => saldoAReceber(nota, hoje))),
    atrasado: somar(atrasadas.map((nota) => saldoAReceber(nota, hoje))),
    quantidadeAtrasadas: atrasadas.length,
    prazoMedianoDias: prazos.length ? prazos[Math.floor(prazos.length / 2)] : 0,
  }
}

/** Nota que fatura a parcela (a cancelada não conta). */
export function notaDaParcela(parcelaId: string, notas: NotaFiscal[]) {
  return notas.find((nota) => nota.parcelaId === parcelaId && !nota.cancelada)
}

export type DadosNota = Pick<NotaFiscal, 'numero' | 'emissao' | 'clienteId' | 'processoId' | 'parcelaId' | 'descricao' | 'valor' | 'previsao'> & {
  comRetencao: boolean
}

/** ISS e retenção saem do valor. */
export function montarNota(id: string, { comRetencao, ...dados }: DadosNota): NotaFiscal {
  return {
    ...dados,
    id,
    iss: Math.round(dados.valor * ALIQUOTA_ISS),
    retencao: comRetencao ? Math.round(dados.valor * ALIQUOTA_RETENCAO) : 0,
  }
}

type Erros = Record<string, string>

/** Erros por campo do formulário. Vazio = pode gravar. */
export function errosDaNota(nota: NotaFiscal, notas: NotaFiscal[], processo?: Processo): Erros {
  const erros: Erros = {}
  if (notas.some((n) => n.numero === nota.numero)) erros.numero = `A NF ${nota.numero} já foi registrada`
  if (nota.valor <= 0) erros.valor = 'Informe um valor maior que zero'
  if (nota.previsao < nota.emissao) erros.previsao = 'A previsão não pode ser antes da emissão'
  if (processo && processo.clienteId !== nota.clienteId) erros.processoId = 'Este projeto é de outro cliente'
  if (nota.parcelaId && notaDaParcela(nota.parcelaId, notas)) erros.parcelaId = 'Esta parcela já tem nota'
  return erros
}

export function errosDoRecebimento(nota: NotaFiscal, recebimento: { data: DataISO; valor: Centavos }, hoje: DataISO): Erros {
  const erros: Erros = {}
  if (recebimento.data < nota.emissao) erros.data = 'O recebimento não pode ser antes da emissão'
  if (recebimento.data > hoje) erros.data = 'Registre só o que já entrou na conta'
  if (recebimento.valor <= 0) erros.valor = 'Informe um valor maior que zero'
  return erros
}

/** Nota com dinheiro recebido não se cancela: primeiro é preciso devolver ou estornar. */
export function motivoParaNaoCancelar(nota: NotaFiscal) {
  if (nota.cancelada) return 'A nota já está cancelada.'
  if (nota.recebimento) return 'A nota já tem recebimento registrado.'
  return undefined
}

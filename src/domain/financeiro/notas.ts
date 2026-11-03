import { diasEntre, type DataISO } from '@/lib/datas'
import { somar, type Centavos } from '@/lib/dinheiro'

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

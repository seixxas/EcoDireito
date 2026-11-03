import { inicioDaSemana, mesDe, somarDias, somarMeses, type DataISO } from '@/lib/datas'
import { reais, somar } from '@/lib/dinheiro'
import { fluxoMensal, movimentosPrevistos, projetarSemanas, type Recorrente } from '@/domain/financeiro/fluxo'
import type { Lancamento } from '@/domain/financeiro/lancamentos'
import { resumoNotas, type NotaFiscal } from '@/domain/financeiro/notas'
import { carregar } from './base'
import { listarParcelasLiberadas } from './processos'
import { ALIQUOTA_ISS, ALIQUOTA_SIMPLES, FIXAS, OCASIONAIS } from './seed/financeiro'

/** Notas do período do histórico, com cliente e processo. */
export async function listarNotas() {
  const { hoje, clientes, processos, financeiro } = await carregar()
  const notas = financeiro.notas
    .filter((nota) => nota.emissao >= financeiro.inicio)
    .map((nota) => ({
      nota,
      cliente: clientes.find((c) => c.id === nota.clienteId)!,
      processo: processos.find((p) => p.id === nota.processoId),
    }))
  return { hoje, meses: financeiro.meses, notas }
}

export async function dadosDaDre() {
  const { financeiro } = await carregar()
  return { meses: financeiro.meses, notas: financeiro.notas, lancamentos: financeiro.lancamentos }
}

/** Média dos 3 últimos meses fechados vira despesa prevista. Mútuo, imobilizado e distribuições extras ficam fora. */
function recorrentesPrevistas(lancamentos: Lancamento[], notas: NotaFiscal[], hoje: DataISO): Recorrente[] {
  const ultimos = [1, 2, 3].map((n) => mesDe(somarMeses(`${mesDe(hoje)}-01`, -n)))
  const media = (filtro: (l: Lancamento) => boolean) =>
    Math.round(somar(lancamentos.filter((l) => ultimos.includes(mesDe(l.data)) && filtro(l)).map((l) => l.valor)) / 3)
  const faturamentoMedio = somar(notas.filter((n) => !n.cancelada && ultimos.includes(mesDe(n.emissao))).map((n) => n.valor)) / 3
  const variaveis = new Set<string>(OCASIONAIS.filter((o) => o.contaId !== 'imobilizado').map((o) => o.contaId))
  const prestadores = media((l) => l.contaId === 'servicos_terceiros')

  return [
    ...FIXAS.map((f) => ({ descricao: f.descricao, valor: -reais((f.min + f.max) / 2), dia: f.dia })),
    { descricao: 'ISS · guia da Prefeitura (estimado)', valor: -Math.round(faturamentoMedio * ALIQUOTA_ISS), dia: 10 },
    { descricao: 'Prestadores de serviço (média)', valor: Math.round(prestadores / 2), dia: 10 },
    { descricao: 'ART (média)', valor: media((l) => l.contaId === 'art'), dia: 15 },
    { descricao: 'DAS · Simples Nacional (estimado)', valor: -Math.round(faturamentoMedio * ALIQUOTA_SIMPLES), dia: 20 },
    { descricao: 'Despesas variáveis (média)', valor: media((l) => variaveis.has(l.contaId)), dia: 20 },
    { descricao: 'Prestadores de serviço (média)', valor: Math.round(prestadores / 2), dia: 25 },
  ]
}

export async function projecaoDeCaixa(quantidadeSemanas = 8) {
  const { hoje, financeiro } = await carregar()
  const { notas, lancamentos, saldoInicial, meses, aplicado } = financeiro
  const saldoHoje = saldoInicial + somar(lancamentos.map((l) => l.valor))
  const parcelas = await listarParcelasLiberadas()

  const movimentos = movimentosPrevistos({
    hoje,
    ate: somarDias(inicioDaSemana(hoje), quantidadeSemanas * 7 - 1),
    notas,
    parcelasLiberadas: parcelas.map(({ parcela, processo }) => ({
      descricao: `Faturar ${parcela.descricao.toLowerCase()} · ${processo.empreendimento}`,
      valor: parcela.valor,
    })),
    recorrentes: recorrentesPrevistas(lancamentos, notas, hoje),
  })

  return {
    hoje,
    saldoHoje,
    aplicado,
    semanas: projetarSemanas(saldoHoje, hoje, movimentos, quantidadeSemanas),
    mensal: fluxoMensal(lancamentos, meses, saldoInicial),
    atrasado: resumoNotas(notas, hoje).atrasado,
  }
}

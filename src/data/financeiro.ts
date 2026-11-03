import { and, eq, isNull, max } from 'drizzle-orm'
import { db, exigirBanco, schema } from '@/db'
import { inicioDaSemana, mesDe, somarDias, somarMeses, type DataISO } from '@/lib/datas'
import { reais, somar, type Centavos } from '@/lib/dinheiro'
import { fluxoMensal, movimentosPrevistos, projetarSemanas, type Recorrente } from '@/domain/financeiro/fluxo'
import type { Lancamento } from '@/domain/financeiro/lancamentos'
import { ALIQUOTA_ISS, resumoNotas, type NotaFiscal } from '@/domain/financeiro/notas'
import { situacaoParcela, type Parcela } from '@/domain/financeiro/parcelas'
import type { Cliente } from '@/domain/processos'
import { carregar } from './base'
import { listarParcelasLiberadas } from './processos'
import { ALIQUOTA_SIMPLES, FIXAS, OCASIONAIS } from './seed/financeiro'

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

export async function obterNota(id: string) {
  const { hoje, clientes, processos, contratos, financeiro } = await carregar()
  const nota = financeiro.notas.find((n) => n.id === id)
  if (!nota) return undefined
  return {
    hoje,
    nota,
    cliente: clientes.find((c) => c.id === nota.clienteId)!,
    processo: processos.find((p) => p.id === nota.processoId),
    parcela: contratos.flatMap((c) => c.parcelas).find((p) => p.id === nota.parcelaId),
    lancamentos: financeiro.lancamentos.filter((l) => l.notaId === id),
  }
}

/** O que o formulário de nota precisa. Com `parcelaId`, a nota já nasce ligada à parcela e ao processo dela. */
export async function dadosParaNovaNota(parcelaId?: string) {
  const { hoje, clientes, processos, contratos, financeiro } = await carregar()
  const contrato = contratos.find((c) => c.parcelas.some((p) => p.id === parcelaId))
  const processo = processos.find((p) => p.id === contrato?.processoId)
  return {
    hoje,
    clientes,
    processos,
    notas: financeiro.notas,
    proximoNumero: Math.max(0, ...financeiro.notas.map((n) => n.numero)) + 1,
    deParcela: contrato && processo ? { parcela: contrato.parcelas.find((p) => p.id === parcelaId)!, processo } : undefined,
  }
}

export async function listarLancamentos() {
  const { hoje, processos, financeiro } = await carregar()
  return { hoje, meses: financeiro.meses, lancamentos: financeiro.lancamentos, processos }
}

/** Todo processo, com as parcelas do contrato (vazio se ainda não tem contrato). */
export async function listarContratos() {
  const { hoje, clientes, processos, contratos, financeiro } = await carregar()
  return processos.map((processo) => ({
    processo,
    cliente: clientes.find((c) => c.id === processo.clienteId)!,
    parcelas: (contratos.find((c) => c.processoId === processo.id)?.parcelas ?? []).map((parcela) => ({
      parcela,
      ...situacaoParcela(parcela, processo, financeiro.notas, hoje),
    })),
  }))
}

export async function gravarNota(nota: Omit<NotaFiscal, 'recebimento' | 'cancelada'>) {
  exigirBanco()
  await db.insert(schema.notasFiscais).values(nota)
}

export async function gravarCancelamento(notaId: string) {
  exigirBanco()
  await db.update(schema.notasFiscais).set({ cancelada: true }).where(eq(schema.notasFiscais.id, notaId))
}

/** Um recebimento por nota: registrar de novo substitui o anterior e o lançamento de receita dele. */
export async function gravarRecebimento(nota: NotaFiscal, cliente: Cliente, recebimento: { data: DataISO; valor: Centavos }) {
  exigirBanco()
  const { notasFiscais, lancamentos } = schema
  const nomeCurto = cliente.nome.split(' ').slice(0, 3).join(' ')
  await db.batch([
    db.update(notasFiscais).set({ recebimentoData: recebimento.data, recebimentoValor: recebimento.valor }).where(eq(notasFiscais.id, nota.id)),
    db.delete(lancamentos).where(and(eq(lancamentos.notaId, nota.id), eq(lancamentos.contaId, 'receita_servicos'))),
    db.insert(lancamentos).values({
      id: crypto.randomUUID(),
      data: recebimento.data,
      competencia: mesDe(recebimento.data),
      descricao: `${nomeCurto} · NF ${nota.numero}`,
      contaId: 'receita_servicos',
      valor: recebimento.valor,
      processoId: nota.processoId,
      notaId: nota.id,
    }),
  ])
}

export async function gravarLancamento(lancamento: Omit<Lancamento, 'id'>) {
  exigirBanco()
  await db.insert(schema.lancamentos).values({ id: crypto.randomUUID(), ...lancamento })
}

/** O lançamento de receita de uma nota muda pela nota (registrando o recebimento de novo), não por aqui. */
export async function apagarLancamento(id: string) {
  exigirBanco()
  await db.delete(schema.lancamentos).where(and(eq(schema.lancamentos.id, id), isNull(schema.lancamentos.notaId)))
}

type DadosParcela = Pick<Parcela, 'descricao' | 'valor' | 'gatilho'>

export async function alterarParcela(id: string, dados: DadosParcela) {
  exigirBanco()
  await db.update(schema.parcelas).set(dados).where(eq(schema.parcelas.id, id))
}

/** Na primeira parcela, cria o contrato do processo. A nova parcela entra no fim. */
export async function adicionarParcela(processoId: string, dados: DadosParcela) {
  exigirBanco()
  const { contratos, parcelas } = schema
  const [existente] = await db.select().from(contratos).where(eq(contratos.processoId, processoId))
  const contratoId = existente?.id ?? crypto.randomUUID()
  if (!existente) await db.insert(contratos).values({ id: contratoId, processoId })
  const [{ ultima }] = await db.select({ ultima: max(parcelas.ordem) }).from(parcelas).where(eq(parcelas.contratoId, contratoId))
  await db.insert(parcelas).values({ id: crypto.randomUUID(), contratoId, ordem: (ultima ?? 0) + 1, ...dados })
}

export async function apagarParcela(id: string) {
  exigirBanco()
  await db.delete(schema.parcelas).where(eq(schema.parcelas.id, id))
}

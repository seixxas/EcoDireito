import { and, asc, desc, eq, isNull, max, sql } from 'drizzle-orm'
import type { BatchItem } from 'drizzle-orm/batch'
import { db, exigirBanco, schema, temBanco } from '@/db'
import { inicioDaSemana, mesDe, somarDias, somarMeses, type DataISO } from '@/lib/datas'
import { reais, somar, type Centavos } from '@/lib/dinheiro'
import { palavrasDe, sugerirParaTodas, type Regra, type Sugestao } from '@/domain/financeiro/classificacao'
import type { LinhaExtrato } from '@/domain/financeiro/extrato'
import { fluxoMensal, movimentosPrevistos, projetarSemanas, type Recorrente } from '@/domain/financeiro/fluxo'
import type { EdicaoLancamento, Lancamento } from '@/domain/financeiro/lancamentos'
import { ALIQUOTA_ISS, resumoNotas, type NotaFiscal } from '@/domain/financeiro/notas'
import { situacaoParcela, type Parcela } from '@/domain/financeiro/parcelas'
import type { ContaId } from '@/domain/financeiro/plano-de-contas'
import type { Cliente } from '@/domain/processos'
import { carregar } from './base'
import { listarParcelasLiberadas } from './processos'
import { exigirArea } from './sessao'
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

/** O lançamento com a nota e a linha do extrato de onde veio (a descrição original do banco). */
export async function obterLancamento(id: string) {
  const { hoje, processos, financeiro } = await carregar()
  const lancamento = financeiro.lancamentos.find((l) => l.id === id)
  if (!lancamento) return undefined
  // Leitura direta no banco, fora de carregar(): a guarda tem de estar aqui.
  await exigirArea('financeiro')
  const [linhaExtrato] = temBanco ? await db.select().from(schema.extratoLinhas).where(eq(schema.extratoLinhas.lancamentoId, id)).limit(1) : []
  return {
    hoje,
    lancamento,
    processos,
    nota: financeiro.notas.find((n) => n.id === lancamento.notaId),
    linhaExtrato: linhaExtrato as LinhaDoExtrato | undefined,
  }
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

type Comando = BatchItem<'pg'>

/**
 * Um recebimento por nota. Corrigir atualiza o lançamento de receita que já existe, em vez de trocar por outro:
 * assim ele continua ligado à linha do extrato que o conciliou.
 */
async function comandosDoRecebimento(nota: NotaFiscal, cliente: Cliente, recebimento: { data: DataISO; valor: Centavos }, linhaExtratoId?: string) {
  const { notasFiscais, lancamentos } = schema
  const [anterior] = await db
    .select({ id: lancamentos.id })
    .from(lancamentos)
    .where(and(eq(lancamentos.notaId, nota.id), eq(lancamentos.contaId, 'receita_servicos')))
    .limit(1)
  const lancamentoId = anterior?.id ?? crypto.randomUUID()
  const receita = {
    data: recebimento.data,
    competencia: mesDe(recebimento.data),
    descricao: `${cliente.nome.split(' ').slice(0, 3).join(' ')} · NF ${nota.numero}`,
    contaId: 'receita_servicos',
    valor: recebimento.valor,
    processoId: nota.processoId,
    notaId: nota.id,
  }
  const comandos: Comando[] = [
    db.update(notasFiscais).set({ recebimentoData: recebimento.data, recebimentoValor: recebimento.valor }).where(eq(notasFiscais.id, nota.id)),
    anterior ? db.update(lancamentos).set(receita).where(eq(lancamentos.id, lancamentoId)) : db.insert(lancamentos).values({ id: lancamentoId, ...receita }),
  ]
  return linhaExtratoId ? [...comandos, comandoDeVinculo(linhaExtratoId, lancamentoId)] : comandos
}

/** Código do Postgres para divisão por zero: é o sinal de "linha já lançada" em comandoDeVinculo. */
const LINHA_JA_LANCADA = '22012'

/**
 * Liga a linha do extrato ao lançamento só se ela ainda estiver livre. Se outra confirmação chegou antes
 * (clique duplo, duas abas), a divisão por zero derruba o lote inteiro (o batch do Neon é uma transação) e nada é gravado em dobro.
 */
function comandoDeVinculo(linhaExtratoId: string, lancamentoId: string) {
  return db.execute(sql`
    with ligada as (
      update extrato_linhas set lancamento_id = ${lancamentoId}
      where id = ${linhaExtratoId} and lancamento_id is null
      returning 1
    )
    select 1 / (select count(*) from ligada)::int
  `)
}

function comandosDoLancamento(linha: LinhaDoExtrato, conta: { contaId: ContaId; processoId?: string }): Comando[] {
  const lancamentoId = crypto.randomUUID()
  return [
    db.insert(schema.lancamentos).values({ id: lancamentoId, data: linha.data, competencia: mesDe(linha.data), descricao: linha.descricao, valor: linha.valor, ...conta }),
    comandoDeVinculo(linha.id, lancamentoId),
  ]
}

/** Devolve false se alguma linha do extrato já tinha sido lançada (nesse caso nada foi gravado). */
async function executar(comandos: Comando[]) {
  if (!comandos.length) return true
  try {
    await db.batch(comandos as [Comando, ...Comando[]])
    return true
  } catch (erro) {
    const { code, cause } = erro as { code?: string; cause?: { code?: string } }
    if ((code ?? cause?.code) === LINHA_JA_LANCADA) return false
    throw erro
  }
}

export async function gravarRecebimento(nota: NotaFiscal, cliente: Cliente, recebimento: { data: DataISO; valor: Centavos }) {
  exigirBanco()
  await executar(await comandosDoRecebimento(nota, cliente, recebimento))
}

export async function gravarLancamento(lancamento: Omit<Lancamento, 'id'>) {
  exigirBanco()
  await db.insert(schema.lancamentos).values({ id: crypto.randomUUID(), ...lancamento })
}

/** Grava o que `alteracoesDoLancamento` deixou mudar. Campo ausente fica como está; vazio vira null. */
export async function alterarLancamento(id: string, alteracoes: Partial<EdicaoLancamento>) {
  exigirBanco()
  const { processoId, observacao, ...resto } = alteracoes
  await db
    .update(schema.lancamentos)
    .set({ ...resto, observacao: observacao ?? null, ...('processoId' in alteracoes && { processoId: processoId ?? null }) })
    .where(eq(schema.lancamentos.id, id))
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

export type LinhaDoExtrato = typeof schema.extratoLinhas.$inferSelect

/** Linhas do extrato e regras. Sem banco, tudo vazio: não há extrato fictício. */
async function extratoERegras() {
  // Leitura direta no banco, fora de carregar(): a guarda tem de estar aqui.
  await exigirArea('financeiro')
  if (!temBanco) return { linhas: [], regras: [] }
  const [linhas, regras] = await Promise.all([
    db.select().from(schema.extratoLinhas).orderBy(desc(schema.extratoLinhas.data)),
    db.select().from(schema.regrasClassificacao).orderBy(asc(schema.regrasClassificacao.contem)),
  ])
  return { linhas, regras: regras.map((r): Regra => ({ id: r.id, contem: r.contem, contaId: r.contaId as ContaId, processoId: r.processoId ?? undefined })) }
}

/** A fila "a classificar": linhas sem lançamento e não ignoradas, cada uma com a sua sugestão. */
export async function filaDoExtrato() {
  const [{ hoje, clientes, processos, financeiro }, { linhas, regras }] = await Promise.all([carregar(), extratoERegras()])
  const vinculados = new Set(linhas.map((l) => l.lancamentoId))
  const pendentes = sugerirParaTodas(
    linhas.filter((l) => !l.lancamentoId && !l.ignorada),
    { lancamentosSemExtrato: financeiro.lancamentos.filter((l) => !vinculados.has(l.id)), notas: financeiro.notas, clientes, regras },
  )
  return {
    hoje,
    clientes,
    processos,
    notas: financeiro.notas,
    regras,
    pendentes,
    ignoradas: linhas.filter((l) => l.ignorada && !l.lancamentoId),
    lancadas: linhas.filter((l) => l.lancamentoId).length,
  }
}

/** Grava as linhas novas e pula as que já tinham sido importadas. Devolve quantas entraram. */
export async function gravarLinhasExtrato(linhas: LinhaExtrato[], arquivo: string) {
  exigirBanco()
  const novas = await db
    .insert(schema.extratoLinhas)
    .values(linhas.map((linha) => ({ id: crypto.randomUUID(), arquivo, ...linha })))
    .onConflictDoNothing({ target: schema.extratoLinhas.chave })
    .returning({ id: schema.extratoLinhas.id })
  return novas.length
}

/** Confirma as sugestões numa ida só ao banco. Devolve false se alguma linha já tinha sido lançada (nada é gravado). */
export async function aplicarSugestoes(itens: { linha: LinhaDoExtrato; sugestao: Sugestao }[], clientes: Cliente[]) {
  exigirBanco()
  const comandos = await Promise.all(
    itens.map(({ linha, sugestao }) => {
      if (sugestao.tipo === 'lancamento') return [comandoDeVinculo(linha.id, sugestao.lancamento.id)]
      if (sugestao.tipo === 'nota') {
        const cliente = clientes.find((c) => c.id === sugestao.nota.clienteId)!
        return comandosDoRecebimento(sugestao.nota, cliente, { data: linha.data, valor: linha.valor }, linha.id)
      }
      return comandosDoLancamento(linha, { contaId: sugestao.regra.contaId, processoId: sugestao.regra.processoId })
    }),
  )
  return executar(comandos.flat())
}

/** Devolve false se a linha já tinha sido lançada. */
export async function lancarLinhaExtrato(linha: LinhaDoExtrato, conta: { contaId: ContaId; processoId?: string }) {
  exigirBanco()
  return executar(comandosDoLancamento(linha, conta))
}

/** Devolve false se a linha já tinha sido lançada. */
export async function receberPelaLinhaExtrato(linha: LinhaDoExtrato, nota: NotaFiscal, cliente: Cliente) {
  exigirBanco()
  return executar(await comandosDoRecebimento(nota, cliente, { data: linha.data, valor: linha.valor }, linha.id))
}

export async function ignorarLinhaExtrato(id: string, ignorada: boolean) {
  exigirBanco()
  await db.update(schema.extratoLinhas).set({ ignorada }).where(eq(schema.extratoLinhas.id, id))
}

/** Uma regra por trecho: gravar o mesmo trecho de novo troca a conta. */
export async function gravarRegra(regra: Omit<Regra, 'id'>) {
  exigirBanco()
  const contem = palavrasDe(regra.contem).join(' ')
  await db
    .insert(schema.regrasClassificacao)
    .values({ id: crypto.randomUUID(), ...regra, contem })
    .onConflictDoUpdate({ target: schema.regrasClassificacao.contem, set: { contaId: regra.contaId, processoId: regra.processoId ?? null } })
}

export async function apagarRegra(id: string) {
  exigirBanco()
  await db.delete(schema.regrasClassificacao).where(eq(schema.regrasClassificacao.id, id))
}

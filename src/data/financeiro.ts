import type { ClientSession } from 'mongodb'
import { db, emTransacao, exigirBanco, exigirVinculo, temBanco } from '@/db'
import type { ExtratoLinhaDoc } from '@/db/documentos'
import { inicioDaSemana, mesDe, somarDias, somarMeses, type DataISO } from '@/lib/datas'
import { reais, somar, type Centavos } from '@/lib/dinheiro'
import { palavrasDe, sugerirParaTodas, type Regra, type Sugestao } from '@/domain/financeiro/classificacao'
import type { LinhaExtrato } from '@/domain/financeiro/extrato'
import { gerarOfx, linhasDeExemplo } from '@/domain/financeiro/extrato-exemplo'
import { fluxoMensal, movimentosPrevistos, projetarSemanas, type Recorrente } from '@/domain/financeiro/fluxo'
import type { EdicaoLancamento, Lancamento } from '@/domain/financeiro/lancamentos'
import { lucratividade } from '@/domain/financeiro/lucratividade'
import { ALIQUOTA_ISS, resumoNotas, type NotaFiscal } from '@/domain/financeiro/notas'
import { situacaoDoContrato, situacaoParcela, type Parcela } from '@/domain/financeiro/parcelas'
import type { ContaId } from '@/domain/financeiro/plano-de-contas'
import type { Cliente } from '@/domain/processos'
import { carregar } from './base'
import { listarParcelasLiberadas } from './processos'
import { exigirArea } from './sessao'
import { guardarNaTela } from './telas'
import { ALIQUOTA_SIMPLES, FIXAS, OCASIONAIS } from './seed/financeiro'

export type ItemNota = Awaited<ReturnType<typeof listarNotas>>['notas'][number]

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
  const { hoje, financeiro } = await carregar()
  return { hoje, meses: financeiro.meses, notas: financeiro.notas, lancamentos: financeiro.lancamentos }
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

/** Lucratividade de cada projeto com proposta aceita. O custo da equipe é simulado (veja `lucratividade.ts`). */
export async function lucratividadePorProjeto() {
  const { hoje, clientes, processos, contratos, financeiro } = await carregar()
  const contratado = (processoId: string) => somar(contratos.find((c) => c.processoId === processoId)?.parcelas.map((p) => p.valor) ?? [])
  return processos
    .filter((processo) => situacaoDoContrato(processo, hoje) === 'fechado')
    .map((processo) => ({
      processo,
      cliente: clientes.find((c) => c.id === processo.clienteId)!,
      ...lucratividade({ processo, contratado: contratado(processo.id), notas: financeiro.notas, lancamentos: financeiro.lancamentos, hoje }),
    }))
}

/** Um projeto da lucratividade, com as notas dele. */
export async function lucratividadeDoProjeto(processoId: string) {
  const [projetos, { hoje, financeiro }] = await Promise.all([lucratividadePorProjeto(), carregar()])
  const projeto = projetos.find((p) => p.processo.id === processoId)
  if (!projeto) return undefined
  const notas = financeiro.notas.filter((n) => n.processoId === processoId).sort((a, b) => b.emissao.localeCompare(a.emissao))
  return { hoje, ...projeto, notas }
}

/** O lançamento com a nota e a linha do extrato de onde veio (a descrição original do banco). */
/** A linha do extrato que originou o lançamento. */
async function linhaDoLancamento(id: string) {
  'use cache: private'
  guardarNaTela()
  // Leitura direta no banco, fora de carregar(): a guarda tem de estar aqui.
  await exigirArea('financeiro')
  if (!temBanco) return undefined
  const linha = await db.extratoLinhas.findOne({ lancamentoId: id })
  return linha ? linhaDoBanco(linha) : undefined
}

export async function obterLancamento(id: string) {
  const { hoje, processos, financeiro } = await carregar()
  const lancamento = financeiro.lancamentos.find((l) => l.id === id)
  if (!lancamento) return undefined
  const linhaExtrato = await linhaDoLancamento(id)
  return {
    hoje,
    lancamento,
    processos,
    nota: financeiro.notas.find((n) => n.id === lancamento.notaId),
    linhaExtrato: linhaExtrato as LinhaDoExtrato | undefined,
  }
}

/** Todo processo, com as parcelas do contrato (vazio se ainda não tem contrato) e se a proposta já foi aceita. */
export async function listarContratos() {
  const { hoje, clientes, processos, contratos, financeiro } = await carregar()
  return processos.map((processo) => ({
    processo,
    situacao: situacaoDoContrato(processo, hoje),
    cliente: clientes.find((c) => c.id === processo.clienteId)!,
    parcelas: (contratos.find((c) => c.processoId === processo.id)?.parcelas ?? []).map((parcela) => ({
      parcela,
      ...situacaoParcela(parcela, processo, financeiro.notas, hoje),
    })),
  }))
}

export async function gravarNota({ id, numero, emissao, clienteId, processoId, parcelaId, descricao, valor, iss, retencao, previsao }: Omit<NotaFiscal, 'recebimento' | 'cancelada'>) {
  exigirBanco()
  await Promise.all([exigirVinculo(db.clientes, clienteId), exigirVinculo(db.processos, processoId), exigirVinculo(db.parcelas, parcelaId)])
  await db.notasFiscais.insertOne({ _id: id, numero, emissao, clienteId, processoId, parcelaId, descricao, valor, iss, retencao, previsao, cancelada: false, criadoEm: new Date() })
}

export async function gravarCancelamento(notaId: string) {
  exigirBanco()
  await db.notasFiscais.updateOne({ _id: notaId }, { $set: { cancelada: true } })
}

/** Uma gravação dentro da transação de `executar`. */
type Comando = (session: ClientSession) => Promise<unknown>

/**
 * Um recebimento por nota. Corrigir atualiza o lançamento de receita que já existe, em vez de trocar por outro:
 * assim ele continua ligado à linha do extrato que o conciliou.
 */
async function comandosDoRecebimento(nota: NotaFiscal, cliente: Cliente, recebimento: { data: DataISO; valor: Centavos }, linhaExtratoId?: string) {
  const anterior = await db.lancamentos.findOne({ notaId: nota.id, contaId: 'receita_servicos' }, { projection: { _id: 1 } })
  const lancamentoId = anterior?._id ?? crypto.randomUUID()
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
    (session) => db.notasFiscais.updateOne({ _id: nota.id }, { $set: { recebimentoData: recebimento.data, recebimentoValor: recebimento.valor } }, { session }),
    (session) =>
      anterior
        ? db.lancamentos.updateOne({ _id: lancamentoId }, { $set: receita }, { session })
        : db.lancamentos.insertOne({ _id: lancamentoId, ...receita, criadoEm: new Date() }, { session }),
  ]
  return linhaExtratoId ? [...comandos, comandoDeVinculo(linhaExtratoId, lancamentoId)] : comandos
}

/** Sinal de "linha já lançada" em comandoDeVinculo: desfaz a transação inteira. */
class LinhaJaLancada extends Error {}

/**
 * Liga a linha do extrato ao lançamento só se ela ainda estiver livre. Se outra confirmação chegou antes
 * (clique duplo, duas abas), o erro desfaz a transação inteira e nada é gravado em dobro.
 */
function comandoDeVinculo(linhaExtratoId: string, lancamentoId: string): Comando {
  return async (session) => {
    const { matchedCount } = await db.extratoLinhas.updateOne({ _id: linhaExtratoId, lancamentoId: null }, { $set: { lancamentoId } }, { session })
    if (!matchedCount) throw new LinhaJaLancada()
  }
}

function comandosDoLancamento(linha: LinhaDoExtrato, { contaId, processoId }: { contaId: ContaId; processoId?: string }): Comando[] {
  const lancamentoId = crypto.randomUUID()
  return [
    (session) =>
      db.lancamentos.insertOne(
        { _id: lancamentoId, data: linha.data, competencia: mesDe(linha.data), descricao: linha.descricao, valor: linha.valor, contaId, processoId, criadoEm: new Date() },
        { session },
      ),
    comandoDeVinculo(linha.id, lancamentoId),
  ]
}

/** Devolve false se alguma linha do extrato já tinha sido lançada (nesse caso nada foi gravado). */
async function executar(comandos: Comando[]) {
  if (!comandos.length) return true
  try {
    await emTransacao(async (session) => {
      for (const comando of comandos) await comando(session)
    })
    return true
  } catch (erro) {
    if (erro instanceof LinhaJaLancada) return false
    throw erro
  }
}

export async function gravarRecebimento(nota: NotaFiscal, cliente: Cliente, recebimento: { data: DataISO; valor: Centavos }) {
  exigirBanco()
  await executar(await comandosDoRecebimento(nota, cliente, recebimento))
}

export async function gravarLancamento({ data, competencia, descricao, contaId, valor, processoId, notaId, observacao }: Omit<Lancamento, 'id'>) {
  exigirBanco()
  await Promise.all([exigirVinculo(db.processos, processoId), exigirVinculo(db.notasFiscais, notaId)])
  await db.lancamentos.insertOne({ _id: crypto.randomUUID(), data, competencia, descricao, contaId, valor, processoId, notaId, observacao, criadoEm: new Date() })
}

/** Grava o que `alteracoesDoLancamento` deixou mudar. Campo ausente fica como está; vazio vira null. */
export async function alterarLancamento(id: string, alteracoes: Partial<EdicaoLancamento>) {
  exigirBanco()
  const { processoId, observacao, ...resto } = alteracoes
  await exigirVinculo(db.processos, processoId)
  await db.lancamentos.updateOne({ _id: id }, { $set: { ...resto, observacao: observacao ?? null, ...('processoId' in alteracoes && { processoId: processoId ?? null }) } })
}

/** O lançamento de receita de uma nota muda pela nota (registrando o recebimento de novo), não por aqui. A linha do extrato ligada a ele volta para a fila. */
export async function apagarLancamento(id: string) {
  exigirBanco()
  await emTransacao(async (session) => {
    const { deletedCount } = await db.lancamentos.deleteOne({ _id: id, notaId: null }, { session })
    if (deletedCount) await db.extratoLinhas.updateMany({ lancamentoId: id }, { $set: { lancamentoId: null } }, { session })
  })
}

type DadosParcela = Pick<Parcela, 'descricao' | 'valor' | 'gatilho'>

export async function alterarParcela(id: string, { descricao, valor, gatilho }: DadosParcela) {
  exigirBanco()
  await db.parcelas.updateOne({ _id: id }, { $set: { descricao, valor, gatilho } })
}

/** Na primeira parcela, cria o contrato do processo. A nova parcela entra no fim. */
export async function adicionarParcela(processoId: string, { descricao, valor, gatilho }: DadosParcela) {
  exigirBanco()
  await exigirVinculo(db.processos, processoId)
  const contrato = await db.contratos.findOneAndUpdate({ processoId }, { $setOnInsert: { _id: crypto.randomUUID() } }, { upsert: true, returnDocument: 'after' })
  const contratoId = contrato!._id
  const ultima = await db.parcelas.findOne({ contratoId }, { sort: { ordem: -1 }, projection: { ordem: 1 } })
  await db.parcelas.insertOne({ _id: crypto.randomUUID(), contratoId, ordem: (ultima?.ordem ?? 0) + 1, descricao, valor, gatilho })
}

/** A nota que faturou a parcela continua existindo, sem o vínculo. */
export async function apagarParcela(id: string) {
  exigirBanco()
  await emTransacao(async (session) => {
    await db.notasFiscais.updateMany({ parcelaId: id }, { $set: { parcelaId: null } }, { session })
    await db.parcelas.deleteOne({ _id: id }, { session })
  })
}

export type LinhaDoExtrato = Omit<ExtratoLinhaDoc, '_id'> & { id: string }

function linhaDoBanco({ _id, ...linha }: ExtratoLinhaDoc): LinhaDoExtrato {
  return { id: _id, ...linha, lancamentoId: linha.lancamentoId ?? null }
}

/** Linhas do extrato e regras. Sem banco, tudo vazio: não há extrato fictício. */
async function extratoERegras() {
  'use cache: private'
  guardarNaTela()
  // Leitura direta no banco, fora de carregar(): a guarda tem de estar aqui.
  await exigirArea('financeiro')
  if (!temBanco) return { linhas: [], regras: [] }
  const [linhas, regras] = await Promise.all([
    db.extratoLinhas.find({}, { sort: { data: -1, _id: 1 }, batchSize: 10_000 }).toArray(),
    db.regrasClassificacao.find({}, { sort: { contem: 1 } }).toArray(),
  ])
  return {
    linhas: linhas.map(linhaDoBanco),
    regras: regras.map((r): Regra => ({ id: r._id, contem: r.contem, contaId: r.contaId as ContaId, processoId: r.processoId ?? undefined })),
  }
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

/** O extrato de exemplo (OFX) montado da base de hoje: sempre bate com as notas e os lançamentos que estão lá. */
export async function extratoDeExemplo() {
  const [{ hoje, clientes, financeiro }, { linhas }] = await Promise.all([carregar(), extratoERegras()])
  const vinculados = new Set(linhas.map((l) => l.lancamentoId))
  return {
    hoje,
    ofx: gerarOfx(
      linhasDeExemplo({ hoje, lancamentosSemExtrato: financeiro.lancamentos.filter((l) => !vinculados.has(l.id)), notas: financeiro.notas, clientes }),
    ),
  }
}

/** Grava as linhas novas e pula as que já tinham sido importadas. Devolve quantas entraram. */
export async function gravarLinhasExtrato(linhas: LinhaExtrato[], arquivo: string) {
  exigirBanco()
  if (!linhas.length) return 0
  const importadoEm = new Date()
  const { upsertedCount } = await db.extratoLinhas.bulkWrite(
    linhas.map(({ chave, data, descricao, valor }) => ({
      updateOne: {
        filter: { chave },
        update: { $setOnInsert: { _id: crypto.randomUUID(), data, descricao, valor, arquivo, lancamentoId: null, ignorada: false, importadoEm } },
        upsert: true,
      },
    })),
  )
  return upsertedCount
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
  await db.extratoLinhas.updateOne({ _id: id }, { $set: { ignorada } })
}

/** Uma regra por trecho: gravar o mesmo trecho de novo troca a conta. */
export async function gravarRegra(regra: Omit<Regra, 'id'>) {
  exigirBanco()
  await exigirVinculo(db.processos, regra.processoId)
  const contem = palavrasDe(regra.contem).join(' ')
  await db.regrasClassificacao.updateOne(
    { contem },
    { $set: { contaId: regra.contaId, processoId: regra.processoId ?? null }, $setOnInsert: { _id: crypto.randomUUID(), criadoEm: new Date() } },
    { upsert: true },
  )
}

export async function apagarRegra(id: string) {
  exigirBanco()
  await db.regrasClassificacao.deleteOne({ _id: id })
}

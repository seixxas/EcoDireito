import { diasEntre, mesDe, mesesEntre, somarDias, somarMeses, type DataISO } from '@/lib/datas'
import { reais, somar, type Centavos } from '@/lib/dinheiro'
import { diaUtilAnterior, ehDiaUtil, proximoDiaUtil } from '@/domain/feriados'
import type { Lancamento } from '@/domain/financeiro/lancamentos'
import type { NotaFiscal } from '@/domain/financeiro/notas'
import type { Contrato } from '@/domain/financeiro/parcelas'
import type { ContaId } from '@/domain/financeiro/plano-de-contas'
import type { Processo } from '@/domain/processos'
import { criarAleatorio, type Aleatorio } from './aleatorio'
import { CLIENTES } from './clientes'
import { PARCELA_A_FATURAR } from './processos'

export const MESES_DE_HISTORICO = 10
export const ALIQUOTA_SIMPLES = 0.155
export const ALIQUOTA_ISS = 0.05
const RETENCAO = 0.055
const NUMERO_PRIMEIRA_NOTA = 512

const SALDO_INICIAL = reais(258_400)
const APLICADO_INICIAL = reais(300_000)
const CAIXA_MINIMO = reais(40_000)
const CAIXA_ALVO = reais(90_000)
const CAIXA_EXCESSO = reais(320_000)

/** Faturamento-alvo de cada mês (R$ mil), a partir do primeiro mês do histórico. */
const FATURAMENTO_MENSAL = [470, 610, 440, 250, 390, 270, 160, 230, 390, 310, 360]
const VALORES_NOTA = [1_500, 2_500, 2_500, 3_000, 4_500, 5_000, 5_000, 5_000, 6_000, 7_000, 7_000, 7_500, 9_500, 10_000, 12_000, 15_000, 18_000, 20_000, 25_000, 30_000, 38_000, 40_000, 60_000, 90_000]
const SERVICOS = ['Licenciamento ambiental', 'Manejo arbóreo', 'Laudo de vegetação', 'Consultoria ambiental', 'Projeto de compensação', 'Acompanhamento de TCA']
const PRAZOS_PAGAMENTO = [3, 7, 10, 14, 15, 15, 20, 21, 30, 30, 30, 45, 60]
/** Nota extra de R$ 1.000 que sai junto com outra (natureza a confirmar com a Eco Direito). */
const DESCRICAO_TAXAS = 'Taxas e emolumentos (reembolso)'

type Despesa = { contaId: ContaId; descricao: string; min: number; max: number }

/** Saem todo mês no mesmo dia. Também alimentam a projeção do fluxo de caixa. */
export const FIXAS: (Despesa & { dia: number })[] = [
  { dia: 2, contaId: 'cartao', descricao: 'Fatura do cartão de crédito', min: 10_300, max: 23_000 },
  { dia: 2, contaId: 'distribuicao_lucros', descricao: 'Retirada das sócias', min: 25_500, max: 25_500 },
  { dia: 5, contaId: 'aluguel', descricao: 'Aluguel do escritório', min: 2_468, max: 2_468 },
  { dia: 8, contaId: 'estacionamento', descricao: 'Estacionamento mensal', min: 480, max: 830 },
  { dia: 10, contaId: 'ti', descricao: 'Sistemas e licenças', min: 2_088, max: 2_088 },
  { dia: 10, contaId: 'contabilidade', descricao: 'Escritório de contabilidade', min: 884, max: 884 },
  { dia: 12, contaId: 'energia', descricao: 'Energia elétrica', min: 90, max: 380 },
  { dia: 15, contaId: 'telecom', descricao: 'Telefonia e internet', min: 115, max: 540 },
  { dia: 18, contaId: 'doacoes', descricao: 'Doação mensal', min: 300, max: 300 },
]

export const OCASIONAIS: (Despesa & { chance: number })[] = [
  { contaId: 'agua', descricao: 'Conta de água', chance: 0.5, min: 150, max: 840 },
  { contaId: 'escritorio', descricao: 'Material de escritório', chance: 0.9, min: 120, max: 1_800 },
  { contaId: 'copa', descricao: 'Copa e café', chance: 0.5, min: 130, max: 680 },
  { contaId: 'alimentacao', descricao: 'Alimentação em campo', chance: 0.9, min: 140, max: 2_400 },
  { contaId: 'transporte', descricao: 'Combustível e transporte', chance: 0.7, min: 120, max: 870 },
  { contaId: 'seguros', descricao: 'Seguro', chance: 0.3, min: 700, max: 9_000 },
  { contaId: 'manutencao_veiculos', descricao: 'Manutenção de veículo', chance: 0.4, min: 580, max: 2_800 },
  { contaId: 'juridico', descricao: 'Assessoria jurídica', chance: 0.25, min: 5_000, max: 5_000 },
  { contaId: 'eventos', descricao: 'Evento com clientes', chance: 0.9, min: 2_200, max: 13_000 },
  { contaId: 'gerais', descricao: 'Despesas gerais', chance: 0.15, min: 500, max: 1_800 },
  { contaId: 'equipamentos', descricao: 'Ferramentas e EPIs', chance: 0.5, min: 1_400, max: 7_000 },
  { contaId: 'imobilizado', descricao: 'Parcela do veículo da empresa', chance: 0.8, min: 8_000, max: 25_000 },
]

const PRESTADORES: (Omit<Despesa, 'contaId'> & { vezes: [number, number] })[] = [
  { descricao: 'Viveiro Mata Nativa · manejo e plantio', min: 8_000, max: 38_000, vezes: [2, 4] },
  { descricao: 'Plotagens Paulista · plantas para a SVMA', min: 250, max: 1_200, vezes: [2, 4] },
  { descricao: 'Topografia Andrade · levantamento', min: 2_000, max: 6_000, vezes: [0, 2] },
  { descricao: 'Remoção Vegetal Express · caminhão', min: 1_500, max: 5_000, vezes: [0, 2] },
  { descricao: 'Projetista autônoma · plantas', min: 1_500, max: 3_500, vezes: [1, 1] },
  { descricao: 'Levantamento arbóreo (PJ)', min: 1_518, max: 1_518, vezes: [1, 1] },
  { descricao: 'Jardinagem Primavera · manutenção de mudas', min: 800, max: 2_200, vezes: [0, 2] },
]

/** Restituições da Receita Federal, por índice do mês no histórico. */
const REEMBOLSOS: Record<number, number> = { 0: 13_638, 1: 19_025, 6: 28_916 }

type Rascunho<T> = Omit<T, 'id' | 'numero'>

const nomeCurto = (clienteId: string) => CLIENTES.find((c) => c.id === clienteId)!.nome.split(' ').slice(0, 3).join(' ')

function diasUteis(de: DataISO, ate: DataISO) {
  const dias: DataISO[] = []
  for (let dia = de; dia <= ate; dia = somarDias(dia, 1)) if (ehDiaUtil(dia)) dias.push(dia)
  return dias
}

function sortearRecebimento(a: Aleatorio, hoje: DataISO, emissao: DataISO, previsao: DataISO, liquido: Centavos): NotaFiscal['recebimento'] {
  const limitar = (data: DataISO) => (data > hoje ? hoje : data < emissao ? emissao : data)
  if (previsao >= hoje) return a.chance(0.1) ? { data: limitar(somarDias(emissao, a.inteiro(2, 6))), valor: liquido } : undefined
  const recente = diasEntre(previsao, hoje) <= 75
  const sorte = a.numero()
  if (sorte < (recente ? 0.2 : 0.025)) return undefined
  const data = limitar(somarDias(previsao, a.inteiro(-4, 6)))
  return { data, valor: sorte < (recente ? 0.23 : 0.04) ? Math.round(liquido / 2) : liquido }
}

function gerarNotas(a: Aleatorio, hoje: DataISO, meses: string[], processos: Processo[], contratos: Contrato[]): NotaFiscal[] {
  const notas: Rascunho<NotaFiscal>[] = []
  const sorteio = CLIENTES.flatMap((cliente) => Array<(typeof CLIENTES)[number]>(cliente.peso).fill(cliente))

  const emitir = (emissao: DataISO, clienteId: string, valor: Centavos, descricao: string, extra: Partial<NotaFiscal> = {}) => {
    // Na planilha real, as notas de R$ 1.000 (taxas) vêm sem retenção.
    const retem = CLIENTES.find((c) => c.id === clienteId)!.retem && descricao !== DESCRICAO_TAXAS
    const retencao = retem ? Math.round(valor * RETENCAO) : 0
    const previsao = somarDias(emissao, a.escolher(PRAZOS_PAGAMENTO))
    // Notas de antes do histórico (parcelas antigas de contrato) já foram pagas.
    const recebimento =
      emissao < `${meses[0]}-01` ? { data: previsao, valor: valor - retencao } : sortearRecebimento(a, hoje, emissao, previsao, valor - retencao)
    notas.push({ emissao, clienteId, descricao, valor, iss: Math.round(valor * ALIQUOTA_ISS), retencao, previsao, recebimento, ...extra })
    return valor
  }

  // Parcelas de contrato: a nota sai de 1 a 4 dias depois do evento que libera a parcela.
  for (const contrato of contratos) {
    const processo = processos.find((p) => p.id === contrato.processoId)!
    const liberadas = contrato.parcelas.filter((pc) => processo.eventos.some((e) => e.tipo === pc.gatilho && e.data <= hoje))
    liberadas.forEach((parcela, i) => {
      if (PARCELA_A_FATURAR.has(processo.id) && i === liberadas.length - 1) return
      const evento = processo.eventos.find((e) => e.tipo === parcela.gatilho)!
      const emissao = proximoDiaUtil(somarDias(evento.data, a.inteiro(1, 4)))
      if (emissao > hoje) return
      emitir(emissao, processo.clienteId, parcela.valor, `${parcela.descricao} · ${processo.empreendimento}`, {
        processoId: processo.id,
        parcelaId: parcela.id,
      })
    })
  }

  // Notas avulsas até bater o faturamento-alvo do mês.
  meses.forEach((mes, i) => {
    const primeiro = `${mes}-01`
    const atual = mes === mesDe(hoje)
    const dias = diasUteis(primeiro, atual ? hoje : somarDias(somarMeses(primeiro, 1), -1))
    if (!dias.length) return
    const fracao = atual ? (diasEntre(primeiro, hoje) + 1) / 30 : 1
    const alvo = reais(FATURAMENTO_MENSAL[i % FATURAMENTO_MENSAL.length] * 1_000 * fracao)
    let total = somar(notas.filter((n) => mesDe(n.emissao) === mes).map((n) => n.valor))
    let ultima: Rascunho<NotaFiscal> | undefined

    while (total < alvo) {
      const emissao = a.escolher(dias)
      const cliente = a.escolher(sorteio)
      total += emitir(emissao, cliente.id, reais(a.escolher(VALORES_NOTA)), a.escolher(SERVICOS))
      ultima = notas.at(-1)
      if (a.chance(0.25)) total += emitir(emissao, cliente.id, reais(1_000), DESCRICAO_TAXAS)
    }
    // Uma nota cancelada a cada dois meses, em média (erro de emissão refeito no mesmo dia).
    if (ultima && a.chance(0.5)) notas.push({ ...ultima, cancelada: true, recebimento: undefined })
  })

  return notas
    .sort((x, y) => x.emissao.localeCompare(y.emissao))
    .map((nota, i) => ({ ...nota, id: `nf${NUMERO_PRIMEIRA_NOTA + i}`, numero: NUMERO_PRIMEIRA_NOTA + i }))
}

function gerarLancamentos(a: Aleatorio, hoje: DataISO, meses: string[], notas: NotaFiscal[], processos: Processo[]) {
  const inicio = `${meses[0]}-01`
  const lista: Rascunho<Lancamento>[] = []
  const lancar = (data: DataISO, contaId: ContaId, descricao: string, valor: Centavos, extra: Partial<Lancamento> = {}) => {
    if (data >= inicio && data <= hoje) lista.push({ data, competencia: mesDe(data), contaId, descricao, valor, ...extra })
  }

  for (const nota of notas) {
    if (!nota.recebimento) continue
    lancar(nota.recebimento.data, 'receita_servicos', `${nomeCurto(nota.clienteId)} · NF ${nota.numero}`, nota.recebimento.valor, {
      notaId: nota.id,
      processoId: nota.processoId,
    })
  }

  // Notas do ano anterior recebidas no começo do histórico: entram no caixa sem nota no sistema.
  for (let n = 0; n < 8; n++) {
    const cliente = a.escolher(CLIENTES)
    lancar(proximoDiaUtil(somarDias(inicio, a.inteiro(1, 40))), 'receita_servicos', `${nomeCurto(cliente.id)} · NF do ano anterior`, reais(a.inteiro(5, 45) * 1_000))
  }

  const faturado = (mes: string) => somar(notas.filter((n) => !n.cancelada && mesDe(n.emissao) === mes).map((n) => n.valor))
  const idsProcessos = processos.map((p) => p.id)

  meses.forEach((mes, i) => {
    const dia = (n: number) => proximoDiaUtil(somarDias(`${mes}-01`, n - 1))
    const qualquerDia = () => dia(a.inteiro(1, 28))
    const saida = (min: number, max: number) => -reais(min + a.numero() * (max - min))
    const mesAnterior = mesDe(somarDias(`${mes}-01`, -1))
    const faturadoAnterior = i === 0 ? reais(FATURAMENTO_MENSAL[0] * 1_000) : faturado(mesAnterior)

    for (const f of FIXAS) lancar(dia(f.dia), f.contaId, f.descricao, saida(f.min, f.max))
    for (const o of OCASIONAIS) if (a.chance(o.chance)) lancar(qualquerDia(), o.contaId, o.descricao, saida(o.min, o.max))
    lancar(dia(20), 'simples', 'DAS · Simples Nacional', -Math.round(faturadoAnterior * ALIQUOTA_SIMPLES), { competencia: mesAnterior })
    if (i >= 3) lancar(dia(10), 'tributos', 'ISS · guia da Prefeitura', -Math.round(faturadoAnterior * ALIQUOTA_ISS), { competencia: mesAnterior })
    for (let n = a.inteiro(10, 21); n > 0; n--) lancar(qualquerDia(), 'art', 'ART · CREA', -reais(108.4), { processoId: a.escolher(idsProcessos) })
    for (const p of PRESTADORES) {
      for (let n = a.inteiro(...p.vezes); n > 0; n--) {
        lancar(qualquerDia(), 'servicos_terceiros', p.descricao, saida(p.min, p.max), { processoId: a.escolher(idsProcessos) })
      }
    }
    for (let n = a.inteiro(1, 4); n > 0; n--) lancar(qualquerDia(), 'mutuo', 'Empréstimo à Ambiente Legal', saida(5_000, 45_000))
    if (a.chance(0.6)) lancar(dia(a.inteiro(15, 25)), 'distribuicao_lucros', 'Distribuição de lucros', saida(15_000, 40_000))
    for (let n = 3; n > 0; n--) lancar(qualquerDia(), 'despesas_financeiras', 'Tarifas bancárias', saida(60, 250))
    lancar(dia(28), 'receitas_financeiras', 'Rendimento da conta', reais(0.5 + a.numero() * 5))
    if (REEMBOLSOS[i]) lancar(qualquerDia(), 'reembolsos', 'Restituição de INSS retido (Receita Federal)', reais(REEMBOLSOS[i]))
  })

  return lista
}

const arredondar = (valor: Centavos) => Math.ceil(valor / reais(10_000)) * reais(10_000)

/** Resgata da aplicação quando o caixa fica baixo e aplica o excesso no fim do mês, como a Eco Direito faz. */
function equilibrarCaixa(lista: Rascunho<Lancamento>[]) {
  const ordenados = [...lista].sort((x, y) => x.data.localeCompare(y.data) || y.valor - x.valor)
  const resultado: Rascunho<Lancamento>[] = []
  let saldo = SALDO_INICIAL
  let aplicado = APLICADO_INICIAL
  const movimentar = (data: DataISO, valor: Centavos, descricao: string) => {
    resultado.push({ data, competencia: mesDe(data), contaId: 'aplicacoes', descricao, valor })
    saldo += valor
    aplicado -= valor
  }

  let mes = mesDe(ordenados[0].data)
  for (const lancamento of ordenados) {
    if (mesDe(lancamento.data) !== mes) {
      if (saldo > CAIXA_EXCESSO) {
        movimentar(diaUtilAnterior(somarDias(`${mesDe(lancamento.data)}-01`, -1)), -arredondar(saldo - 2 * CAIXA_ALVO), 'Aplicação em CDB')
      }
      mes = mesDe(lancamento.data)
    }
    if (saldo + lancamento.valor < CAIXA_MINIMO) movimentar(lancamento.data, arredondar(CAIXA_ALVO - saldo - lancamento.valor), 'Resgate de aplicação')
    resultado.push(lancamento)
    saldo += lancamento.valor
  }

  const lancamentos: Lancamento[] = resultado
    .sort((x, y) => x.data.localeCompare(y.data))
    .map((lancamento, i) => ({ ...lancamento, id: `l${i + 1}` }))
  return { lancamentos, aplicado }
}

/**
 * Observações de exemplo (o campo serve para o que a descrição do banco não diz).
 * Vão nos lançamentos mais recentes de cada descrição, sem sortear nada: notas, valores e o extrato de exemplo não mudam.
 */
const OBSERVACOES: { descricao: string; quantos: number; texto: (processo?: Processo) => string }[] = [
  { descricao: 'Despesas gerais', quantos: 1, texto: () => 'PIX para o Guilherme: festa de fim de ano da equipe' },
  { descricao: 'Combustível e transporte', quantos: 1, texto: () => 'Reembolso de táxi da vistoria do Jequitibá Campo Belo' },
  { descricao: 'Copa e café', quantos: 2, texto: () => 'Copa: café e água do mês' },
  { descricao: 'Viveiro Mata Nativa · manejo e plantio', quantos: 2, texto: (p) => `Viveiro: mudas do plantio do ${p?.empreendimento ?? 'cliente'}` },
  { descricao: 'ART · CREA', quantos: 2, texto: (p) => `ART do relatório de manejo${p ? ` · ${p.empreendimento}` : ''}` },
  { descricao: 'DAS · Simples Nacional', quantos: 3, texto: () => 'Imposto do faturamento do mês anterior (por isso a competência)' },
  { descricao: 'Tarifas bancárias', quantos: 1, texto: () => 'Pacote de serviços e PIX acima do limite' },
  { descricao: 'Material de escritório', quantos: 1, texto: () => 'Toner e papel para a impressora' },
  { descricao: 'Manutenção de veículo', quantos: 1, texto: () => 'Revisão dos 30 mil km da picape' },
  { descricao: 'Empréstimo à Ambiente Legal', quantos: 1, texto: () => 'Mútuo: devolver até o fim do trimestre' },
]

function comObservacoes(lancamentos: Lancamento[], processos: Processo[]): Lancamento[] {
  const observacoes = new Map<string, string>()
  for (const regra of OBSERVACOES) {
    const recentes = lancamentos.filter((l) => l.descricao === regra.descricao).slice(-regra.quantos)
    for (const l of recentes) observacoes.set(l.id, regra.texto(processos.find((p) => p.id === l.processoId)))
  }
  return lancamentos.map((l) => (observacoes.has(l.id) ? { ...l, observacao: observacoes.get(l.id) } : l))
}

/** Que parte do faturado de cada projeto vira custo direto (ART e prestadores), na ordem dos processos. Dá margens variadas. */
const PARTE_EM_CUSTOS = [0.18, 0.35, 0.5, 0.25, 0.62, 0.3, 0.12, 0.42, 0.28, 0.55, 0.2, 0.38, 0.68, 0.22]

/**
 * O gerador sorteia o processo de cada custo entre todos, até proposta sem aceite, e a margem por projeto sairia sem sentido.
 * Aqui cada custo vai para um projeto que já faturou e já tinha o aceite na data, até a parte do faturado de `PARTE_EM_CUSTOS`;
 * o que sobra fica sem processo (obra de cliente não cadastrado). Não sorteia nada: notas, valores e o extrato de exemplo não mudam.
 */
function custosPorProjeto(lancamentos: Lancamento[], notas: NotaFiscal[], processos: Processo[]): Lancamento[] {
  const faturado = new Map<string, Centavos>()
  for (const n of notas) if (!n.cancelada && n.processoId) faturado.set(n.processoId, (faturado.get(n.processoId) ?? 0) + n.valor)
  const projetos = processos.flatMap((p, i) => {
    const aceite = p.eventos.find((e) => e.tipo === 'aceite_proposta')?.data
    const total = faturado.get(p.id)
    return aceite && total ? [{ id: p.id, aceite, restante: Math.round(total * PARTE_EM_CUSTOS[i % PARTE_EM_CUSTOS.length]) }] : []
  })
  return lancamentos.map((l) => {
    if (!l.processoId || l.valor >= 0) return l
    const [escolhido] = projetos.filter((p) => p.aceite <= l.data && p.restante >= -l.valor / 2).sort((x, y) => y.restante - x.restante)
    if (!escolhido) return { ...l, processoId: undefined }
    escolhido.restante += l.valor
    return { ...l, processoId: escolhido.id }
  })
}

export function gerarFinanceiro(hoje: DataISO, processos: Processo[], contratos: Contrato[]) {
  const a = criarAleatorio(2026)
  const inicio = somarMeses(`${mesDe(hoje)}-01`, -MESES_DE_HISTORICO)
  const meses = mesesEntre(mesDe(inicio), mesDe(hoje))
  const notas = gerarNotas(a, hoje, meses, processos, contratos)
  const { lancamentos, aplicado } = equilibrarCaixa(gerarLancamentos(a, hoje, meses, notas, processos))
  return { inicio, meses, notas, lancamentos: comObservacoes(custosPorProjeto(lancamentos, notas, processos), processos), saldoInicial: SALDO_INICIAL, aplicado }
}

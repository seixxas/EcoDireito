import { mesDe, type DataISO } from '@/lib/datas'
import { somar, type Centavos } from '@/lib/dinheiro'
import { formatarMes } from '@/lib/formatar'
import { mesDoLancamento, type Lancamento } from './lancamentos'
import type { NotaFiscal } from './notas'
import { CONTAS, type ContaId, type GrupoDre } from './plano-de-contas'

export type Regime = 'caixa' | 'competencia'

/** Meta de um mês por conta. */
export type MetasDaDre = Partial<Record<ContaId, Centavos>>

export type LinhaDre = {
  id: string
  nome: string
  /** Vem antes do nome, como na planilha: "(−) Simples Nacional", "= Lucro bruto". */
  sinal?: '(−)' | '(±)' | '(+)' | '='
  tipo: 'conta' | 'bloco' | 'secao' | 'subtotal' | 'total'
  /** Bloco que soma esta conta e a esconde enquanto está fechado. */
  bloco?: string
  /** Seção recolhível a que a linha pertence. */
  secao?: string
  /** Um valor por mês, na ordem de `meses`. Vazio em linha de seção. */
  valores: Centavos[]
  /** Meta de cada mês; `null` no que não compõe o resultado. */
  metas: Centavos[] | null
  total: Centavos
}

/** Lançamento ou nota que entra numa conta da DRE, já no mês do regime escolhido. */
export type ItemDaDre = {
  id: string
  origem: 'lancamento' | 'nota'
  mes: string
  data: DataISO
  descricao: string
  contaId: ContaId
  valor: Centavos
}

type Etapa = { grupo: GrupoDre; sinal?: LinhaDre['sinal']; bloco?: string; subtotal?: string; secao?: string }

const ESTRUTURA: Etapa[] = [
  { grupo: 'receita' },
  { grupo: 'imposto', sinal: '(−)', subtotal: 'Receita líquida' },
  { grupo: 'custo', sinal: '(−)', bloco: 'Custo dos serviços prestados', subtotal: 'Lucro bruto' },
  { grupo: 'despesa', sinal: '(−)', bloco: 'Despesas operacionais', subtotal: 'Resultado operacional' },
  { grupo: 'financeiro', sinal: '(±)', bloco: 'Resultado financeiro' },
  { grupo: 'outras', sinal: '(+)', bloco: 'Outras receitas', subtotal: 'Resultado líquido' },
  { grupo: 'fora', sinal: '(±)', bloco: 'Movimentações de caixa', subtotal: 'Variação de caixa', secao: 'Movimentação de caixa · não compõe o resultado' },
]

/**
 * Caixa: tudo pela data do dinheiro.
 * Competência: receita pela emissão da nota; o resto pela competência do lançamento.
 * A grade e o detalhe de uma célula saem daqui, para os dois sempre baterem.
 */
function itensDoRegime({ lancamentos, notas, regime }: { lancamentos: Lancamento[]; notas: NotaFiscal[]; regime: Regime }): ItemDaDre[] {
  const doBanco = lancamentos
    .filter((lancamento) => regime === 'caixa' || lancamento.contaId !== 'receita_servicos')
    .map(
      (lancamento): ItemDaDre => ({
        id: lancamento.id,
        origem: 'lancamento',
        mes: mesDoLancamento(lancamento, regime),
        data: lancamento.data,
        descricao: lancamento.descricao,
        contaId: lancamento.contaId,
        valor: lancamento.valor,
      }),
    )
  if (regime === 'caixa') return doBanco
  const emitidas = notas
    .filter((nota) => !nota.cancelada)
    .map(
      (nota): ItemDaDre => ({
        id: nota.id,
        origem: 'nota',
        mes: mesDe(nota.emissao),
        data: nota.emissao,
        descricao: `NF ${nota.numero} · ${nota.descricao}`,
        contaId: 'receita_servicos',
        valor: nota.valor,
      }),
    )
  return [...doBanco, ...emitidas]
}

const somarColunas = (colunas: Centavos[][], meses: string[]) => meses.map((_, i) => somar(colunas.map((valores) => valores[i])))

/** Cada subtotal é a soma de tudo que veio acima: despesa já entra negativa. */
export function montarDre(entrada: { lancamentos: Lancamento[]; notas: NotaFiscal[]; meses: string[]; regime: Regime; metas?: MetasDaDre }): LinhaDre[] {
  const { meses, metas = {} } = entrada
  const indice = new Map(meses.map((mes, i) => [mes, i]))
  const porConta = new Map<ContaId, Centavos[]>()

  for (const item of itensDoRegime(entrada)) {
    const i = indice.get(item.mes)
    if (i === undefined) continue
    const valores = porConta.get(item.contaId) ?? meses.map(() => 0)
    valores[i] += item.valor
    porConta.set(item.contaId, valores)
  }

  const linhas: LinhaDre[] = []
  const acumulado = meses.map(() => 0)
  const metaAcumulada = meses.map(() => 0)

  for (const etapa of ESTRUTURA) {
    const secao = etapa.secao && `secao-${etapa.grupo}`
    const comMeta = etapa.grupo !== 'fora'
    if (secao) linhas.push({ id: secao, nome: etapa.secao!, tipo: 'secao', valores: [], metas: null, total: 0 })

    // Conta com meta e sem valor no período continua na grade: sem ela, a meta do bloco não fecharia com o subtotal.
    const contas = CONTAS.filter((conta) => conta.grupo === etapa.grupo && (porConta.has(conta.id) || (comMeta && metas[conta.id]))).map((conta): LinhaDre => {
      const valores = porConta.get(conta.id) ?? meses.map(() => 0)
      return { id: conta.id, nome: conta.nome, tipo: 'conta', valores, metas: comMeta ? meses.map(() => metas[conta.id] ?? 0) : null, total: somar(valores), secao }
    })

    for (const conta of contas) {
      conta.valores.forEach((valor, i) => (acumulado[i] += valor))
      conta.metas?.forEach((meta, i) => (metaAcumulada[i] += meta))
    }

    if (etapa.bloco && contas.length) {
      const id = `bloco-${etapa.grupo}`
      const valores = somarColunas(contas.map((conta) => conta.valores), meses)
      const metasDoBloco = comMeta ? somarColunas(contas.map((conta) => conta.metas!), meses) : null
      linhas.push({ id, nome: etapa.bloco, sinal: etapa.sinal, tipo: 'bloco', valores, metas: metasDoBloco, total: somar(valores), secao })
      linhas.push(...contas.map((conta) => ({ ...conta, bloco: id })))
    } else {
      linhas.push(...contas.map((conta) => ({ ...conta, sinal: etapa.sinal })))
    }

    if (etapa.subtotal) {
      const nome = etapa.grupo === 'fora' && entrada.regime === 'competencia' ? 'Resultado após itens fora da DRE' : etapa.subtotal
      linhas.push({
        id: `subtotal-${etapa.grupo}`,
        nome,
        sinal: '=',
        tipo: comMeta ? 'subtotal' : 'total',
        valores: [...acumulado],
        metas: comMeta ? [...metaAcumulada] : null,
        total: somar(acumulado),
      })
    }
  }

  return linhas
}

export const rotuloDaLinha = (linha: Pick<LinhaDre, 'nome' | 'sinal'>) => (linha.sinal ? `${linha.sinal} ${linha.nome}` : linha.nome)

/** Positiva melhora o resultado, inclusive nas linhas de custo, que são negativas. Sem meta, não há o que comparar. */
export function difDaMeta(realizado: Centavos, meta: Centavos | undefined): number | null {
  return meta ? (realizado - meta) / Math.abs(meta) : null
}

/**
 * A Eco Direito ainda não tem meta cadastrada. Até ter, a grade usa esta meta de exemplo: a média mensal da conta nos
 * meses dados, em centenas de reais, com receita e imposto 10% acima e os gastos 5% abaixo. O que está fora do resultado não tem meta.
 */
export function metasDeExemplo(lancamentos: Lancamento[], meses: string[]): MetasDaDre {
  const metas: MetasDaDre = {}
  if (!meses.length) return metas
  for (const conta of CONTAS) {
    if (conta.grupo === 'fora') continue
    const doPeriodo = lancamentos.filter((lancamento) => lancamento.contaId === conta.id && meses.includes(mesDe(lancamento.data)))
    const ajuste = conta.grupo === 'receita' || conta.grupo === 'imposto' ? 1.1 : 0.95
    const meta = Math.round(((somar(doPeriodo.map((lancamento) => lancamento.valor)) / meses.length) * ajuste) / 10_000) * 10_000
    if (meta) metas[conta.id] = meta
  }
  return metas
}

export type PeriodoDre = { id: string; rotulo: string; meses: string[] }

/** Período completo, só os meses fechados (quando o último ainda está aberto) e cada trimestre, mesmo incompleto. */
export function periodosDaDre(meses: string[], mesAtual: string): PeriodoDre[] {
  const fechados = meses.filter((mes) => mes < mesAtual)
  const trimestres = new Map<string, PeriodoDre>()
  for (const mes of meses) {
    const trimestre = Math.ceil(Number(mes.slice(5, 7)) / 3)
    const id = `${mes.slice(0, 4)}-t${trimestre}`
    const periodo = trimestres.get(id) ?? { id, rotulo: `${trimestre}º tri/${mes.slice(2, 4)}`, meses: [] }
    trimestres.set(id, { ...periodo, meses: [...periodo.meses, mes] })
  }
  return [
    { id: 'tudo', rotulo: 'Período completo', meses },
    ...(fechados.length && fechados.length < meses.length ? [{ id: 'fechados', rotulo: 'Até o último mês fechado', meses: fechados }] : []),
    ...trimestres.values(),
  ]
}

/** Contas somadas por uma linha clicável: a própria conta ou todas as de um bloco. */
function contasDaLinha(linha: string) {
  const grupo = linha.startsWith('bloco-') ? linha.slice('bloco-'.length) : undefined
  return CONTAS.filter((conta) => (grupo ? conta.grupo === grupo : conta.id === linha)).map((conta) => conta.id)
}

/** O que forma um valor da grade, do mais recente para o mais antigo. */
export function itensDaLinha(entrada: { linha: string; lancamentos: Lancamento[]; notas: NotaFiscal[]; meses: string[]; regime: Regime }): ItemDaDre[] {
  const contas = new Set<ContaId>(contasDaLinha(entrada.linha))
  return itensDoRegime(entrada)
    .filter((item) => contas.has(item.contaId) && entrada.meses.includes(item.mes))
    .sort((a, b) => b.data.localeCompare(a.data))
}

/** O Excel lê como fórmula o texto que começa com = + - @ ("= Lucro bruto" viraria #NOME?). */
const textoParaExcel = (texto: string) => (/^[=+\-@]/.test(texto) ? `'${texto}` : texto)
const decimal = (centavos: Centavos) => (centavos / 100).toFixed(2).replace('.', ',')
const percentual = (fracao: number | null) => (fracao === null ? '' : (fracao * 100).toFixed(1).replace('.', ','))

/** CSV com ";" e vírgula decimal, que abre direto no Excel em português. Leva todas as linhas, mesmo as recolhidas na tela. */
export function csvDaDre(linhas: LinhaDre[], meses: string[]) {
  const trio = (rotulo: string) => [`Meta ${rotulo}`, `Realizado ${rotulo}`, `Dif. % ${rotulo}`]
  const cabecalho = ['Linha da DRE', ...meses.flatMap((mes) => trio(formatarMes(mes))), ...trio('Período')]
  const colunas = (realizado: Centavos, meta?: Centavos) => [meta === undefined ? '' : decimal(meta), decimal(realizado), percentual(difDaMeta(realizado, meta))]

  const corpo = linhas.map((linha) => {
    const rotulo = textoParaExcel(`${linha.bloco ? '   ' : ''}${rotuloDaLinha(linha)}`)
    if (linha.tipo === 'secao') return [rotulo]
    return [
      rotulo,
      ...linha.valores.flatMap((valor, i) => colunas(valor, linha.metas?.[i])),
      ...colunas(linha.total, linha.metas ? somar(linha.metas) : undefined),
    ]
  })

  return [cabecalho, ...corpo].map((linha) => linha.map((celula) => `"${celula.replace(/"/g, '""')}"`).join(';')).join('\r\n')
}

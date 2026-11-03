import { mesDe } from '@/lib/datas'
import { somar, type Centavos } from '@/lib/dinheiro'
import { mesDoLancamento, type Lancamento } from './lancamentos'
import type { NotaFiscal } from './notas'
import { CONTAS, type ContaId, type GrupoDre } from './plano-de-contas'

export type Regime = 'caixa' | 'competencia'

export type LinhaDre = {
  id: string
  nome: string
  tipo: 'conta' | 'secao' | 'subtotal'
  /** Um valor por mês, na ordem de `meses`. Vazio em linha de seção. */
  valores: Centavos[]
  total: Centavos
}

const ESTRUTURA: { grupo: GrupoDre; titulo?: string; subtotal?: string }[] = [
  { grupo: 'receita' },
  { grupo: 'imposto', subtotal: 'Receita líquida' },
  { grupo: 'custo', titulo: 'Custo dos serviços prestados', subtotal: 'Lucro bruto' },
  { grupo: 'despesa', titulo: 'Despesas operacionais', subtotal: 'Resultado operacional' },
  { grupo: 'financeiro', titulo: 'Resultado financeiro' },
  { grupo: 'outras', titulo: 'Outras receitas', subtotal: 'Resultado líquido' },
  { grupo: 'fora', titulo: 'Fora da DRE (não entra no resultado)', subtotal: 'Variação de caixa' },
]

/**
 * Caixa: tudo pela data do dinheiro.
 * Competência: receita pela emissão da nota; o resto pela competência do lançamento.
 */
export function montarDre(entrada: {
  lancamentos: Lancamento[]
  notas: NotaFiscal[]
  meses: string[]
  regime: Regime
}): LinhaDre[] {
  const { lancamentos, notas, meses, regime } = entrada
  const indice = new Map(meses.map((mes, i) => [mes, i]))
  const porConta = new Map<ContaId, Centavos[]>()

  const somarEm = (conta: ContaId, mes: string, valor: Centavos) => {
    const i = indice.get(mes)
    if (i === undefined) return
    const valores = porConta.get(conta) ?? meses.map(() => 0)
    valores[i] += valor
    porConta.set(conta, valores)
  }

  for (const lancamento of lancamentos) {
    if (regime === 'competencia' && lancamento.contaId === 'receita_servicos') continue
    somarEm(lancamento.contaId, mesDoLancamento(lancamento, regime), lancamento.valor)
  }
  if (regime === 'competencia') {
    for (const nota of notas) if (!nota.cancelada) somarEm('receita_servicos', mesDe(nota.emissao), nota.valor)
  }

  const linhas: LinhaDre[] = []
  const acumulado = meses.map(() => 0)

  for (const etapa of ESTRUTURA) {
    if (etapa.titulo) linhas.push({ id: `secao-${etapa.grupo}`, nome: etapa.titulo, tipo: 'secao', valores: [], total: 0 })
    for (const conta of CONTAS.filter((c) => c.grupo === etapa.grupo)) {
      const valores = porConta.get(conta.id)
      if (!valores) continue
      valores.forEach((valor, i) => (acumulado[i] += valor))
      linhas.push({ id: conta.id, nome: conta.nome, tipo: 'conta', valores, total: somar(valores) })
    }
    if (etapa.subtotal) {
      const nome = etapa.grupo === 'fora' && regime === 'competencia' ? 'Resultado após itens fora da DRE' : etapa.subtotal
      linhas.push({ id: `subtotal-${etapa.grupo}`, nome, tipo: 'subtotal', valores: [...acumulado], total: somar(acumulado) })
    }
  }

  return linhas
}

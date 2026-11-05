import { describe, expect, it } from 'vitest'
import { somar } from '@/lib/dinheiro'
import { csvDaDre, difDaMeta, itensDaLinha, metasDeExemplo, montarDre, periodosDaDre, rotuloDaLinha, type LinhaDre } from './dre'
import type { Lancamento } from './lancamentos'
import type { NotaFiscal } from './notas'

const meses = ['2026-01', '2026-02']

const lancamento = (id: string, data: string, contaId: Lancamento['contaId'], valor: number, competencia = data.slice(0, 7)): Lancamento => ({
  id,
  data,
  competencia,
  descricao: id,
  contaId,
  valor,
})

const nota = (id: string, emissao: string, valor: number, cancelada = false): NotaFiscal => ({
  id,
  numero: 100,
  emissao,
  clienteId: 'c1',
  descricao: 'Licenciamento',
  valor,
  iss: 0,
  retencao: 0,
  previsao: emissao,
  cancelada,
})

const lancamentos = [
  lancamento('receita', '2026-01-15', 'receita_servicos', 100_000),
  lancamento('simples', '2026-01-20', 'simples', -15_000),
  lancamento('art', '2026-01-21', 'art', -5_000),
  lancamento('terceiros', '2026-02-05', 'servicos_terceiros', -30_000),
  lancamento('aluguel', '2026-02-06', 'aluguel', -20_000),
  lancamento('lucros', '2026-01-05', 'distribuicao_lucros', -10_000),
]

const achar = (linhas: LinhaDre[], id: string) => linhas.find((linha) => linha.id === id)!

describe('grade da DRE', () => {
  const dre = montarDre({ lancamentos, notas: [], meses, regime: 'caixa', metas: { receita_servicos: 90_000, art: -4_000, aluguel: -20_000 } })

  it('soma as contas vizinhas num bloco, com as contas dentro dele', () => {
    expect(achar(dre, 'bloco-custo')).toMatchObject({ tipo: 'bloco', sinal: '(−)', valores: [-5_000, -30_000], total: -35_000 })
    expect(achar(dre, 'art').bloco).toBe('bloco-custo')
    expect(achar(dre, 'servicos_terceiros').bloco).toBe('bloco-custo')
  })

  it('conta sozinha no grupo não vira bloco e leva o sinal', () => {
    expect(dre.some((linha) => linha.id === 'bloco-imposto')).toBe(false)
    expect(rotuloDaLinha(achar(dre, 'simples'))).toBe('(−) Simples Nacional')
    expect(achar(dre, 'simples').bloco).toBeUndefined()
  })

  it('cada subtotal é a soma do que veio acima, nos valores e na meta', () => {
    expect(achar(dre, 'subtotal-custo').valores).toEqual([80_000, -30_000])
    expect(achar(dre, 'subtotal-custo').metas).toEqual([86_000, 86_000])
    expect(rotuloDaLinha(achar(dre, 'subtotal-outras'))).toBe('= Resultado líquido')
    expect(achar(dre, 'subtotal-outras').total).toBe(30_000)
  })

  it('o que não compõe o resultado fica numa seção, sem meta, e fecha na variação de caixa', () => {
    expect(achar(dre, 'secao-fora').tipo).toBe('secao')
    expect(achar(dre, 'bloco-fora')).toMatchObject({ secao: 'secao-fora', metas: null })
    expect(achar(dre, 'distribuicao_lucros')).toMatchObject({ secao: 'secao-fora', bloco: 'bloco-fora', metas: null })
    expect(achar(dre, 'subtotal-fora')).toMatchObject({ tipo: 'total', metas: null, total: 20_000 })
  })

  it('conta com meta e sem valor no período continua na grade', () => {
    const soAluguel = montarDre({ lancamentos: [], notas: [], meses, regime: 'caixa', metas: { aluguel: -20_000 } })
    expect(achar(soAluguel, 'aluguel')).toMatchObject({ valores: [0, 0], metas: [-20_000, -20_000] })
    expect(achar(soAluguel, 'subtotal-despesa').metas).toEqual([-20_000, -20_000])
  })
})

describe('diferença para a meta', () => {
  it('positiva melhora o resultado, inclusive em custo', () => {
    expect(difDaMeta(110_000, 100_000)).toBeCloseTo(0.1)
    expect(difDaMeta(-8_000, -10_000)).toBeCloseTo(0.2)
    expect(difDaMeta(-12_000, -10_000)).toBeCloseTo(-0.2)
  })

  it('não existe sem meta', () => {
    expect(difDaMeta(100, 0)).toBeNull()
    expect(difDaMeta(100, undefined)).toBeNull()
  })
})

describe('meta de exemplo', () => {
  it('é a média mensal em centenas de reais, com receita acima e gastos abaixo', () => {
    const metas = metasDeExemplo(lancamentos, meses)
    expect(metas.receita_servicos).toBe(60_000)
    // ART: média de R$ 25 por mês, que nem chega a uma centena.
    expect(metas.art).toBeUndefined()
    expect(metas.aluguel).toBe(-10_000)
  })

  it('não cria meta para o que está fora do resultado nem sem meses', () => {
    expect(metasDeExemplo(lancamentos, meses).distribuicao_lucros).toBeUndefined()
    expect(metasDeExemplo(lancamentos, [])).toEqual({})
  })
})

describe('períodos da DRE', () => {
  it('traz o período completo, os meses fechados e os trimestres, mesmo incompletos', () => {
    const periodos = periodosDaDre(['2025-12', '2026-01', '2026-02', '2026-03', '2026-04'], '2026-04')
    expect(periodos.map((periodo) => periodo.rotulo)).toEqual(['Período completo', 'Até o último mês fechado', '4º tri/25', '1º tri/26', '2º tri/26'])
    expect(periodos[1].meses).toEqual(['2025-12', '2026-01', '2026-02', '2026-03'])
    expect(periodos[3].meses).toEqual(['2026-01', '2026-02', '2026-03'])
  })

  it('sem mês aberto, não repete o período completo', () => {
    expect(periodosDaDre(meses, '2026-03').map((periodo) => periodo.id)).toEqual(['tudo', '2026-t1'])
  })
})

describe('o que forma um valor da grade', () => {
  const movimentos = [...lancamentos, lancamento('competencia', '2026-02-10', 'aluguel', -7_000, '2026-01')]
  const notas = [nota('n1', '2026-01-10', 300_000), nota('n2', '2026-01-11', 50_000, true)]

  it.each(['caixa', 'competencia'] as const)('a soma bate com a grade, por %s', (regime) => {
    const grade = montarDre({ lancamentos: movimentos, notas, meses, regime })
    for (const linha of grade.filter((l) => l.tipo === 'conta' || l.tipo === 'bloco')) {
      const doPeriodo = itensDaLinha({ linha: linha.id, lancamentos: movimentos, notas, meses, regime })
      expect(somar(doPeriodo.map((item) => item.valor))).toBe(linha.total)
      meses.forEach((mes, i) => {
        const doMes = itensDaLinha({ linha: linha.id, lancamentos: movimentos, notas, meses: [mes], regime })
        expect(somar(doMes.map((item) => item.valor))).toBe(linha.valores[i])
      })
    }
  })

  it('o bloco reúne as contas dele', () => {
    const itens = itensDaLinha({ linha: 'bloco-custo', lancamentos, notas: [], meses, regime: 'caixa' })
    expect(itens.map((item) => item.id)).toEqual(['terceiros', 'art'])
  })

  it('na competência, a receita vem das notas não canceladas', () => {
    const itens = itensDaLinha({ linha: 'receita_servicos', lancamentos, notas, meses, regime: 'competencia' })
    expect(itens).toMatchObject([{ id: 'n1', origem: 'nota', descricao: 'NF 100 · Licenciamento', valor: 300_000 }])
  })

  it('linha que não existe não traz nada', () => {
    expect(itensDaLinha({ linha: 'outra', lancamentos, notas, meses, regime: 'caixa' })).toEqual([])
  })
})

describe('exportar para o Excel', () => {
  const dre = montarDre({ lancamentos, notas: [], meses, regime: 'caixa', metas: { receita_servicos: 90_000 } })
  const csv = csvDaDre(dre, meses)
  const linhas = csv.split('\r\n')

  it('usa ponto e vírgula, vírgula decimal e as colunas da tela', () => {
    expect(linhas[0]).toBe(
      '"Linha da DRE";"Meta jan/26";"Realizado jan/26";"Dif. % jan/26";"Meta fev/26";"Realizado fev/26";"Dif. % fev/26";"Meta Período";"Realizado Período";"Dif. % Período"',
    )
    expect(linhas[1]).toBe('"Receita bruta de serviços";"900,00";"1000,00";"11,1";"900,00";"0,00";"-100,0";"1800,00";"1000,00";"-44,4"')
  })

  it('não deixa o Excel ler o rótulo como fórmula', () => {
    expect(csv).toContain(`"'= Receita líquida"`)
    expect(csv).toContain(`"(−) Simples Nacional"`)
  })

  it('leva as contas dos blocos, mesmo recolhidas na tela, e deixa em branco o que não tem meta', () => {
    expect(csv).toContain('"   ART"')
    expect(linhas.at(-1)).toMatch(/^"'= Variação de caixa";"";"700,00";""/)
  })
})

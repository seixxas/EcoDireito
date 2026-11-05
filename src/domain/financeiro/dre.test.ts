import { describe, expect, it } from 'vitest'
import { somar } from '@/lib/dinheiro'
import { csvDaDre, itensDaLinha, montarDre, periodosDaDre, rotuloDaLinha, type LinhaDre } from './dre'
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
  const dre = montarDre({ lancamentos, notas: [], meses, regime: 'caixa' })

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

  it('cada subtotal é a soma do que veio acima', () => {
    expect(achar(dre, 'subtotal-custo').valores).toEqual([80_000, -30_000])
    expect(rotuloDaLinha(achar(dre, 'subtotal-outras'))).toBe('= Resultado líquido')
    expect(achar(dre, 'subtotal-outras').total).toBe(30_000)
  })

  it('o que não compõe o resultado fica numa seção e fecha na variação de caixa', () => {
    expect(achar(dre, 'secao-fora').tipo).toBe('secao')
    expect(achar(dre, 'bloco-fora').secao).toBe('secao-fora')
    expect(achar(dre, 'distribuicao_lucros')).toMatchObject({ secao: 'secao-fora', bloco: 'bloco-fora' })
    expect(achar(dre, 'subtotal-fora')).toMatchObject({ tipo: 'total', total: 20_000 })
  })

  it('conta sem valor no período não aparece', () => {
    expect(dre.some((linha) => linha.id === 'energia')).toBe(false)
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
  const dre = montarDre({ lancamentos, notas: [], meses, regime: 'caixa' })
  const csv = csvDaDre(dre, meses)
  const linhas = csv.split('\r\n')

  it('usa ponto e vírgula, vírgula decimal e as colunas da tela', () => {
    expect(linhas[0]).toBe('"Linha da DRE";"jan/26";"fev/26";"Total";"% receita líq."')
    expect(linhas[1]).toBe('"Receita bruta de serviços";"1000,00";"0,00";"1000,00";"117,6"')
  })

  it('não deixa o Excel ler o rótulo como fórmula', () => {
    expect(csv).toContain(`"'= Receita líquida"`)
    expect(csv).toContain(`"(−) Simples Nacional"`)
  })

  it('leva as contas dos blocos, mesmo recolhidas na tela, e fecha na variação de caixa', () => {
    expect(csv).toContain('"   ART"')
    expect(linhas.at(-1)).toBe(`"'= Variação de caixa";"700,00";"-500,00";"200,00";"23,5"`)
  })

  it('sem receita líquida, deixa o percentual em branco', () => {
    const semReceita = montarDre({ lancamentos: [lancamento('aluguel', '2026-02-06', 'aluguel', -20_000)], notas: [], meses, regime: 'caixa' })
    expect(csvDaDre(semReceita, meses)).toContain('"(−) Despesas operacionais";"0,00";"-200,00";"-200,00";""')
  })
})

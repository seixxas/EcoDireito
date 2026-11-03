import { describe, expect, it } from 'vitest'
import { montarDre } from './dre'
import { movimentosPrevistos, projetarSemanas } from './fluxo'
import type { Lancamento } from './lancamentos'
import { resumoNotas, situacaoNota, type NotaFiscal } from './notas'

const nota = (parcial: Partial<NotaFiscal>): NotaFiscal => ({
  id: 'n1',
  numero: 1,
  emissao: '2026-01-10',
  clienteId: 'c1',
  descricao: 'Serviço',
  valor: 100_000,
  iss: 5_000,
  retencao: 0,
  previsao: '2026-01-25',
  ...parcial,
})

describe('situacaoNota', () => {
  it('calcula pela previsão e pelo recebimento', () => {
    expect(situacaoNota(nota({}), '2026-01-20')).toBe('a_receber')
    expect(situacaoNota(nota({}), '2026-01-26')).toBe('atrasada')
    expect(situacaoNota(nota({ recebimento: { data: '2026-01-24', valor: 100_000 } }), '2026-01-26')).toBe('recebida')
    expect(situacaoNota(nota({ recebimento: { data: '2026-01-24', valor: 50_000 } }), '2026-01-26')).toBe('parcial')
    expect(situacaoNota(nota({ cancelada: true }), '2026-01-26')).toBe('cancelada')
  })

  it('considera a retenção no valor esperado', () => {
    const retida = nota({ retencao: 5_500, recebimento: { data: '2026-01-24', valor: 94_500 } })
    expect(situacaoNota(retida, '2026-01-26')).toBe('recebida')
    expect(resumoNotas([retida], '2026-01-26')).toMatchObject({ faturado: 100_000, recebido: 94_500, aReceber: 0 })
  })
})

describe('montarDre', () => {
  const lancamentos: Lancamento[] = [
    { id: 'l1', data: '2026-01-15', competencia: '2026-01', descricao: '', contaId: 'receita_servicos', valor: 100_000 },
    { id: 'l2', data: '2026-01-20', competencia: '2025-12', descricao: '', contaId: 'simples', valor: -15_000 },
    { id: 'l3', data: '2026-02-05', competencia: '2026-02', descricao: '', contaId: 'servicos_terceiros', valor: -30_000 },
    { id: 'l4', data: '2026-01-05', competencia: '2026-01', descricao: '', contaId: 'distribuicao_lucros', valor: -10_000 },
  ]
  const meses = ['2026-01', '2026-02']
  const total = (linhas: ReturnType<typeof montarDre>, nome: string) => linhas.find((l) => l.nome === nome)!

  it('por caixa usa a data do dinheiro', () => {
    const dre = montarDre({ lancamentos, notas: [], meses, regime: 'caixa' })
    expect(total(dre, 'Receita líquida').valores).toEqual([85_000, 0])
    expect(total(dre, 'Resultado líquido').total).toBe(55_000)
    expect(total(dre, 'Variação de caixa').total).toBe(45_000)
  })

  it('por competência usa a emissão das notas e a competência dos lançamentos', () => {
    const dre = montarDre({ lancamentos, notas: [nota({ valor: 200_000 })], meses, regime: 'competencia' })
    expect(total(dre, 'Receita bruta de serviços').valores).toEqual([200_000, 0])
    expect(total(dre, 'Simples Nacional')).toBeUndefined()
  })
})

describe('fluxo projetado', () => {
  it('soma notas a receber e recorrentes por semana, sem as atrasadas', () => {
    const movimentos = movimentosPrevistos({
      hoje: '2026-11-03',
      ate: '2026-11-30',
      notas: [nota({ previsao: '2026-11-05', emissao: '2026-10-20' }), nota({ id: 'n2', previsao: '2026-10-30' })],
      parcelasLiberadas: [],
      recorrentes: [{ descricao: 'Aluguel', valor: -2_000, dia: 5 }],
    })
    expect(movimentos).toHaveLength(2)
    const [semana] = projetarSemanas(10_000, '2026-11-03', movimentos, 1)
    expect(semana).toMatchObject({ inicio: '2026-11-02', entradas: 100_000, saidas: -2_000, saldoFinal: 108_000 })
  })
})

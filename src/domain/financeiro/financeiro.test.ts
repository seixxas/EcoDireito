import { describe, expect, it } from 'vitest'
import { montarDre } from './dre'
import { diasDaSemana, movimentosPrevistos, projetarSemanas } from './fluxo'
import type { Processo } from '../processos'
import { alteracoesDoLancamento, errosDoLancamento, mesDoLancamento, mesesDaCompetencia, type Lancamento } from './lancamentos'
import { horasEstimadas, lucratividade, porMargem, resumoDaLucratividade, situacaoDaMargem } from './lucratividade'
import { situacaoDoContrato } from './parcelas'
import { errosDaNota, errosDoRecebimento, montarNota, motivoParaNaoCancelar, resumoNotas, situacaoNota, type NotaFiscal } from './notas'

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

describe('registro de nota', () => {
  const dados = { numero: 2, emissao: '2026-11-02', clienteId: 'c1', descricao: 'Serviço', valor: 200_000, previsao: '2026-11-17', comRetencao: true }

  it('calcula ISS e retenção pelo valor', () => {
    expect(montarNota('n2', dados)).toMatchObject({ iss: 10_000, retencao: 11_000 })
    expect(montarNota('n2', { ...dados, comRetencao: false }).retencao).toBe(0)
  })

  it('recusa número repetido, previsão antes da emissão e processo de outro cliente', () => {
    const processo = { clienteId: 'c9' } as Processo
    const erros = errosDaNota(montarNota('n2', { ...dados, numero: 1, previsao: '2026-11-01' }), [nota({})], processo)
    expect(Object.keys(erros)).toEqual(['numero', 'previsao', 'processoId'])
    expect(errosDaNota(montarNota('n2', dados), [nota({})])).toEqual({})
  })

  it('não fatura a mesma parcela duas vezes, a não ser que a nota anterior tenha sido cancelada', () => {
    const nova = montarNota('n2', { ...dados, parcelaId: 'pc1' })
    expect(errosDaNota(nova, [nota({ parcelaId: 'pc1' })])).toHaveProperty('parcelaId')
    expect(errosDaNota(nova, [nota({ parcelaId: 'pc1', cancelada: true })])).toEqual({})
  })
})

describe('recebimento e cancelamento', () => {
  it('aceita recebimento entre a emissão e hoje', () => {
    expect(errosDoRecebimento(nota({}), { data: '2026-01-20', valor: 100_000 }, '2026-01-26')).toEqual({})
    expect(errosDoRecebimento(nota({}), { data: '2026-01-05', valor: 100_000 }, '2026-01-26')).toHaveProperty('data')
    expect(errosDoRecebimento(nota({}), { data: '2026-01-27', valor: 0 }, '2026-01-26')).toEqual({ data: expect.any(String), valor: expect.any(String) })
  })

  it('só cancela nota sem recebimento', () => {
    expect(motivoParaNaoCancelar(nota({}))).toBeUndefined()
    expect(motivoParaNaoCancelar(nota({ recebimento: { data: '2026-01-20', valor: 100 } }))).toBeDefined()
    expect(motivoParaNaoCancelar(nota({ cancelada: true }))).toBeDefined()
  })
})

describe('lançamento manual', () => {
  const lancamento = { data: '2026-11-02', competencia: '2026-11', descricao: 'Aluguel', contaId: 'aluguel', valor: -246_800 } as const

  it('aceita o que já aconteceu, com valor', () => {
    expect(errosDoLancamento(lancamento, '2026-11-02')).toEqual({})
    expect(errosDoLancamento({ ...lancamento, data: '2026-11-03', valor: 0 }, '2026-11-02')).toEqual({ data: expect.any(String), valor: expect.any(String) })
  })
})

describe('edição do lançamento', () => {
  const pix: Lancamento = { id: 'l1', data: '2026-10-14', competencia: '2026-10', descricao: 'PIX ENVIADO GUILHERME', contaId: 'gerais', valor: -85_000 }
  const edicao = { descricao: 'Festa de fim de ano', contaId: 'eventos', competencia: '', processoId: undefined, observacao: '  festa X  ' } as const

  it('muda descrição, conta, competência, processo e observação; competência vazia volta a ser o mês da data', () => {
    expect(alteracoesDoLancamento(pix, edicao)).toEqual({
      descricao: 'Festa de fim de ano',
      contaId: 'eventos',
      competencia: '2026-10',
      processoId: undefined,
      observacao: 'festa X',
    })
  })

  it('no lançamento de uma nota, só a observação', () => {
    expect(alteracoesDoLancamento({ ...pix, notaId: 'n1' }, edicao)).toEqual({ observacao: 'festa X' })
    expect(alteracoesDoLancamento({ ...pix, notaId: 'n1' }, { ...edicao, observacao: '   ' })).toEqual({ observacao: undefined })
  })

  it('mede a competência em meses a partir do mês do pagamento', () => {
    expect(mesesDaCompetencia({ data: '2026-11-20', competencia: '2026-11' })).toBe(0)
    expect(mesesDaCompetencia({ data: '2026-11-20', competencia: '2026-10' })).toBe(-1)
    expect(mesesDaCompetencia({ data: '2027-01-10', competencia: '2026-12' })).toBe(-1)
    expect(mesesDaCompetencia({ data: '2026-11-20', competencia: '2027-02' })).toBe(3)
  })

  it('cai no mês da data (caixa) ou da competência', () => {
    const das = { ...pix, data: '2026-11-20', competencia: '2026-10' }
    expect(mesDoLancamento(das, 'caixa')).toBe('2026-11')
    expect(mesDoLancamento(das, 'competencia')).toBe('2026-10')
  })
})

describe('semana dia a dia', () => {
  const movimentos = [
    { data: '2026-11-03', descricao: 'NF 1', valor: 50_000, origem: 'nota' as const },
    { data: '2026-11-05', descricao: 'Aluguel', valor: -20_000, origem: 'recorrente' as const },
    { data: '2026-11-05', descricao: 'NF 2', valor: 10_000, origem: 'nota' as const },
  ]
  const [semana] = projetarSemanas(100_000, '2026-11-03', movimentos, 1)

  it('reparte os movimentos pelos 7 dias e termina no saldo da semana', () => {
    const dias = diasDaSemana(semana)
    expect(dias.map((d) => d.data)).toEqual(['2026-11-02', '2026-11-03', '2026-11-04', '2026-11-05', '2026-11-06', '2026-11-07', '2026-11-08'])
    expect(dias.map((d) => d.saldoFinal)).toEqual([100_000, 150_000, 150_000, 140_000, 140_000, 140_000, 140_000])
    expect(dias[3]).toMatchObject({ entradas: 10_000, saidas: -20_000 })
    expect(dias.at(-1)!.saldoFinal).toBe(semana.saldoFinal)
  })
})

describe('contrato fechado', () => {
  const comEventos = (...eventos: [string, string][]) =>
    ({ eventos: eventos.map(([tipo, data], i) => ({ id: `e${i}`, tipo, data, origem: 'manual' })) }) as unknown as Processo

  it('só conta como contratado depois do aceite da proposta (até hoje)', () => {
    expect(situacaoDoContrato(comEventos(['proposta_enviada', '2026-10-20']), '2026-11-03')).toBe('proposta')
    expect(situacaoDoContrato(comEventos(['proposta_enviada', '2026-10-20'], ['aceite_proposta', '2026-11-05']), '2026-11-03')).toBe('proposta')
    expect(situacaoDoContrato(comEventos(['aceite_proposta', '2026-11-01']), '2026-11-03')).toBe('fechado')
    expect(situacaoDoContrato(comEventos(['proposta_recusada', '2026-10-30']), '2026-11-03')).toBe('recusada')
    // Como no Comercial: com aceite e recusa, vale a recusa.
    expect(situacaoDoContrato(comEventos(['aceite_proposta', '2026-10-01'], ['proposta_recusada', '2026-10-30']), '2026-11-03')).toBe('recusada')
  })
})

describe('lucratividade por projeto', () => {
  const processo = { id: 'p07', servico: 'licenciamento' } as const
  const notas = [
    nota({ id: 'a', processoId: 'p07', valor: 60_000_00, recebimento: { data: '2026-10-10', valor: 60_000_00 } }),
    nota({ id: 'b', processoId: 'p07', valor: 40_000_00 }),
    nota({ id: 'c', processoId: 'p07', valor: 9_999_00, cancelada: true }),
    nota({ id: 'd', processoId: 'p01', valor: 1_000_00 }),
  ]
  const lancamentos: Lancamento[] = [
    { id: 'l1', data: '2026-09-01', competencia: '2026-09', descricao: 'Viveiro', contaId: 'servicos_terceiros', valor: -20_000_00, processoId: 'p07' },
    { id: 'l2', data: '2026-09-02', competencia: '2026-09', descricao: 'ART', contaId: 'art', valor: -108_40, processoId: 'p07' },
    { id: 'l3', data: '2026-09-03', competencia: '2026-09', descricao: 'Viveiro', contaId: 'servicos_terceiros', valor: -5_000_00, processoId: 'p07' },
    { id: 'l4', data: '2026-10-10', competencia: '2026-10', descricao: 'NF', contaId: 'receita_servicos', valor: 60_000_00, processoId: 'p07' },
    { id: 'l5', data: '2026-09-04', competencia: '2026-09', descricao: 'Outro', contaId: 'art', valor: -999_00, processoId: 'p01' },
  ]
  const lucro = lucratividade({ processo, contratado: 120_000_00, notas, lancamentos, hoje: '2026-11-03' })

  it('soma o faturado sem nota cancelada, o recebido e os custos do processo por conta', () => {
    expect(lucro).toMatchObject({ contratado: 120_000_00, faturado: 100_000_00, recebido: 60_000_00, custosDiretos: 25_108_40 })
    expect(lucro.custosPorConta).toEqual([
      { contaId: 'servicos_terceiros', valor: 25_000_00 },
      { contaId: 'art', valor: 108_40 },
    ])
  })

  it('estima a equipe e calcula a margem sobre o faturado', () => {
    expect(lucro.horas).toBe(horasEstimadas(processo, 100_000_00))
    expect(lucro.custoEquipe).toBe(lucro.horas * 95_00)
    expect(lucro.margem).toBe(100_000_00 - 25_108_40 - lucro.custoEquipe)
    expect(lucro.margemPct).toBeCloseTo(lucro.margem! / 100_000_00)
  })

  it('a equipe fica entre 10% e 20% do faturado no licenciamento, e as horas não mudam entre chamadas', () => {
    for (const id of ['p01', 'p02', 'p13', 'x']) {
      const horas = horasEstimadas({ id, servico: 'licenciamento' }, 100_000_00)
      expect(horas * 95_00).toBeGreaterThanOrEqual(10_000_00)
      expect(horas * 95_00).toBeLessThanOrEqual(20_000_00)
      expect(horasEstimadas({ id, servico: 'licenciamento' }, 100_000_00)).toBe(horas)
    }
  })

  it('classifica a margem: boa a partir de 40%, atenção de 20% a 40%, ruim abaixo', () => {
    expect([0.55, 0.4, 0.3, 0.2, 0.1, -0.5].map(situacaoDaMargem)).toEqual(['boa', 'boa', 'atencao', 'atencao', 'ruim', 'ruim'])
  })

  it('ordena pela margem e deixa quem não faturou por último; o resumo pondera pelo faturado', () => {
    const semFaturar = lucratividade({ processo: { id: 'p20', servico: 'manejo' }, contratado: 50_000_00, notas: [], lancamentos: [], hoje: '2026-11-03' })
    const fraco = { ...lucro, margemPct: 0.1, faturado: 10_000_00, custoTotal: 9_000_00 }
    const lista = [semFaturar, fraco, lucro].sort(porMargem)
    expect(lista).toEqual([lucro, fraco, semFaturar])
    expect(semFaturar.margem).toBeUndefined()
    const resumo = resumoDaLucratividade([semFaturar, fraco, lucro])
    expect(resumo).toMatchObject({ receita: 110_000_00, custo: lucro.custoTotal + 9_000_00, melhor: lucro, pior: fraco })
  })
})

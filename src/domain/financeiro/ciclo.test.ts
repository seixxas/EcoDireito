import { describe, expect, it } from 'vitest'
import { combina } from '@/lib/buscar'
import { brl } from '@/lib/formatar'
import {
  abaDaNota,
  abaUsaMes,
  ehAbaDoCiclo,
  FAIXAS_DE_ATRASO,
  fraseDoCiclo,
  mensagemDeCobranca,
  naFaixa,
  notasPorAba,
  ordenarAtrasadas,
  primeiraAbaComItens,
  recebimentoSugerido,
  valorNaAba,
  type AbaDoCiclo,
} from './ciclo'
import { errosDoRecebimento, type NotaFiscal } from './notas'

const HOJE = '2026-11-04'

const nota = (parcial: Partial<NotaFiscal>): NotaFiscal => ({
  id: 'n1',
  numero: 1,
  emissao: '2026-10-01',
  clienteId: 'c1',
  descricao: 'Serviço',
  valor: 100_000,
  iss: 5_000,
  retencao: 0,
  previsao: '2026-10-20',
  ...parcial,
})

const quantidades = (parcial: Partial<Record<AbaDoCiclo, number>>): Record<AbaDoCiclo, number> => ({
  'a-faturar': 0,
  'a-vencer': 0,
  hoje: 0,
  atrasadas: 0,
  recebidas: 0,
  todas: 0,
  ...parcial,
})

describe('em que aba a nota entra', () => {
  it('nota em aberto segue a previsão', () => {
    expect(abaDaNota(nota({ previsao: '2026-11-05' }), HOJE)).toBe('a-vencer')
    expect(abaDaNota(nota({ previsao: HOJE }), HOJE)).toBe('hoje')
    expect(abaDaNota(nota({ previsao: '2026-11-03' }), HOJE)).toBe('atrasadas')
  })

  it('recebida em parte segue a previsão, nunca vai para Recebidas', () => {
    const recebimento = { data: '2026-10-25', valor: 40_000 }
    expect(abaDaNota(nota({ previsao: '2026-10-20', recebimento }), HOJE)).toBe('atrasadas')
    expect(abaDaNota(nota({ previsao: HOJE, recebimento }), HOJE)).toBe('hoje')
    expect(abaDaNota(nota({ previsao: '2026-12-01', recebimento }), HOJE)).toBe('a-vencer')
  })

  it('recebida vai para Recebidas, mesmo com a diferença de centavos que a situação tolera', () => {
    expect(abaDaNota(nota({ recebimento: { data: '2026-10-25', valor: 100_000 } }), HOJE)).toBe('recebidas')
    expect(abaDaNota(nota({ recebimento: { data: '2026-10-25', valor: 99_950 } }), HOJE)).toBe('recebidas')
  })

  it('recebimento em data futura ainda não conta', () => {
    expect(abaDaNota(nota({ recebimento: { data: '2026-11-10', valor: 100_000 } }), HOJE)).toBe('atrasadas')
  })

  it('cancelada não tem aba, nem atrasada', () => {
    expect(abaDaNota(nota({ cancelada: true }), HOJE)).toBeUndefined()
  })
})

describe('notas de cada aba', () => {
  const item = (parcial: Partial<NotaFiscal>) => ({ nota: nota(parcial) })
  const itens = [
    item({ id: 'atrasada', numero: 10, previsao: '2026-09-15', emissao: '2026-09-01' }),
    item({ id: 'parcial', numero: 11, previsao: '2026-10-20', recebimento: { data: '2026-10-22', valor: 40_000 } }),
    item({ id: 'hoje', numero: 12, emissao: '2026-10-20', previsao: HOJE }),
    item({ id: 'a-vencer', numero: 13, emissao: '2026-11-02', previsao: '2026-11-17' }),
    item({ id: 'cancelada', numero: 14, emissao: '2026-11-03', previsao: '2026-09-01', cancelada: true }),
    item({ id: 'recebida-nov', numero: 15, emissao: '2026-10-05', recebimento: { data: '2026-11-02', valor: 100_000 } }),
    item({ id: 'recebida-out', numero: 16, emissao: '2026-09-10', recebimento: { data: '2026-10-30', valor: 100_000 } }),
  ]
  const ids = (lista: { nota: NotaFiscal }[]) => lista.map(({ nota }) => nota.id)

  it('as abas de estado não dependem do mês', () => {
    const emNovembro = notasPorAba(itens, HOJE, '2026-11')
    const emSetembro = notasPorAba(itens, HOJE, '2026-09')
    for (const aba of ['a-vencer', 'hoje', 'atrasadas'] as const) expect(ids(emNovembro[aba])).toEqual(ids(emSetembro[aba]))
    expect(ids(emNovembro.atrasadas)).toEqual(['atrasada', 'parcial'])
    expect(ids(emNovembro.hoje)).toEqual(['hoje'])
    expect(ids(emNovembro['a-vencer'])).toEqual(['a-vencer'])
  })

  it('Recebidas conta o mês do recebimento, não o da emissão', () => {
    expect(ids(notasPorAba(itens, HOJE, '2026-11').recebidas)).toEqual(['recebida-nov'])
    expect(ids(notasPorAba(itens, HOJE, '2026-10').recebidas)).toEqual(['recebida-out'])
    expect(notasPorAba(itens, HOJE, '2026-09').recebidas).toEqual([])
  })

  it('Todas conta o mês da emissão e inclui a cancelada, da nota mais nova para a mais antiga', () => {
    expect(ids(notasPorAba(itens, HOJE, '2026-11').todas)).toEqual(['cancelada', 'a-vencer'])
    expect(ids(notasPorAba(itens, HOJE, '2026-09').todas)).toEqual(['recebida-out', 'atrasada'])
  })

  it('sem mês, Recebidas e Todas pegam o histórico inteiro; a cancelada continua só em Todas', () => {
    const grupos = notasPorAba(itens, HOJE)
    expect(ids(grupos.recebidas)).toEqual(['recebida-nov', 'recebida-out'])
    expect(grupos.todas).toHaveLength(itens.length)
    const foraDeTodas = [grupos['a-vencer'], grupos.hoje, grupos.atrasadas, grupos.recebidas].flat()
    expect(ids(foraDeTodas)).not.toContain('cancelada')
  })

  it('a busca entra antes: as contagens seguem o que foi buscado', () => {
    const buscadas = itens.filter(({ nota }) => combina('11', nota.numero))
    const grupos = notasPorAba(buscadas, HOJE, '2026-11')
    expect(ids(grupos.atrasadas)).toEqual(['parcial'])
    expect(grupos['a-vencer']).toEqual([])
    expect(primeiraAbaComItens(quantidades({ atrasadas: grupos.atrasadas.length }))).toBe('atrasadas')
    expect(fraseDoCiclo(quantidades({ atrasadas: grupos.atrasadas.length }), '11')).toBe('Com “11”: 1 nota atrasada.')
  })

  it('não mexe na lista recebida', () => {
    const lista = [...itens]
    notasPorAba(lista, HOJE, '2026-11')
    expect(lista).toEqual(itens)
  })
})

describe('valor de cada aba', () => {
  const parcial = nota({ recebimento: { data: '2026-10-25', valor: 40_000 } })

  it('em aberto soma o saldo; Recebidas, o que entrou', () => {
    expect(valorNaAba('atrasadas', parcial, HOJE)).toBe(60_000)
    expect(valorNaAba('recebidas', nota({ recebimento: { data: '2026-10-25', valor: 99_950 } }), HOJE)).toBe(99_950)
  })

  it('o saldo já desconta a retenção', () => {
    expect(valorNaAba('a-vencer', nota({ retencao: 5_500, previsao: '2026-12-01' }), HOJE)).toBe(94_500)
  })

  it('Todas soma o líquido e não soma a cancelada', () => {
    expect(valorNaAba('todas', nota({ retencao: 5_500 }), HOJE)).toBe(94_500)
    expect(valorNaAba('todas', nota({ cancelada: true }), HOJE)).toBe(0)
  })
})

describe('aba inicial', () => {
  it('abre a primeira com itens, na ordem do ciclo', () => {
    expect(primeiraAbaComItens(quantidades({ 'a-faturar': 2, atrasadas: 5 }))).toBe('a-faturar')
    expect(primeiraAbaComItens(quantidades({ atrasadas: 5, todas: 9 }))).toBe('atrasadas')
    expect(primeiraAbaComItens(quantidades({ recebidas: 1 }))).toBe('recebidas')
  })

  it('sem nada, abre Todas, que tem o seletor de mês', () => {
    expect(primeiraAbaComItens(quantidades({}))).toBe('todas')
  })

  it('reconhece o que vem da URL', () => {
    expect(ehAbaDoCiclo('atrasadas')).toBe(true)
    expect(ehAbaDoCiclo('grafico')).toBe(false)
    expect(ehAbaDoCiclo('constructor')).toBe(false)
    expect(ehAbaDoCiclo(undefined)).toBe(false)
    expect(abaUsaMes('todas')).toBe(true)
    expect(abaUsaMes('atrasadas')).toBe(false)
  })
})

describe('faixas e ordem das atrasadas', () => {
  const faixa = (id: string) => FAIXAS_DE_ATRASO.find((f) => f.id === id)!

  it('cada dia de atraso cai numa faixa só, sem buraco', () => {
    for (const previsao of ['2026-11-03', '2026-10-20', '2026-10-19', '2026-10-05', '2026-10-04', '2026-09-05', '2026-09-04', '2026-01-01']) {
      expect(FAIXAS_DE_ATRASO.filter((f) => naFaixa(nota({ previsao }), f, HOJE))).toHaveLength(1)
    }
    expect(naFaixa(nota({ previsao: '2026-11-03' }), faixa('1-15'), HOJE)).toBe(true)
    expect(naFaixa(nota({ previsao: '2026-10-20' }), faixa('1-15'), HOJE)).toBe(true)
    expect(naFaixa(nota({ previsao: '2026-10-19' }), faixa('16-30'), HOJE)).toBe(true)
    expect(naFaixa(nota({ previsao: '2026-09-04' }), faixa('60+'), HOJE)).toBe(true)
  })

  it('ordena pelo atraso ou pelo saldo, e o saldo é o que falta receber', () => {
    const antiga = { nota: nota({ id: 'antiga', previsao: '2026-09-01', valor: 50_000 }) }
    const grande = { nota: nota({ id: 'grande', previsao: '2026-10-20', valor: 90_000 }) }
    const parcial = { nota: nota({ id: 'parcial', previsao: '2026-10-25', valor: 200_000, recebimento: { data: '2026-10-26', valor: 180_000 } }) }
    const lista = [grande, parcial, antiga]
    expect(ordenarAtrasadas(lista, 'atraso', HOJE).map(({ nota }) => nota.id)).toEqual(['antiga', 'grande', 'parcial'])
    expect(ordenarAtrasadas(lista, 'saldo', HOJE).map(({ nota }) => nota.id)).toEqual(['grande', 'antiga', 'parcial'])
  })
})

describe('recebimento sugerido', () => {
  it('nota sem recebimento traz o saldo e a data de hoje, prontos para gravar', () => {
    const retida = nota({ retencao: 5_500 })
    const sugestao = recebimentoSugerido(retida, HOJE)
    expect(sugestao).toEqual({ data: HOJE, valor: 94_500 })
    expect(errosDoRecebimento(retida, sugestao, HOJE)).toEqual({})
  })

  it('nota recebida em parte traz o que está gravado: confirmar não pode trocar o recebido pelo saldo', () => {
    const recebimento = { data: '2026-10-25', valor: 40_000 }
    expect(recebimentoSugerido(nota({ recebimento }), HOJE)).toEqual(recebimento)
  })
})

describe('mensagem de cobrança', () => {
  it('traz cliente, NF, valor e dias de atraso', () => {
    const mensagem = mensagemDeCobranca(nota({ numero: 2040, retencao: 5_500 }), 'Altavista Pinheiros', HOJE)
    expect(mensagem).toContain('NF 2040')
    expect(mensagem).toContain('Altavista Pinheiros')
    expect(mensagem).toContain(`valor de ${brl(94_500)}`)
    expect(mensagem).toContain('15 dias de atraso')
  })

  it('na recebida em parte cobra o saldo', () => {
    const mensagem = mensagemDeCobranca(nota({ recebimento: { data: '2026-10-25', valor: 40_000 } }), 'Cliente', HOJE)
    expect(mensagem).toContain(`saldo de ${brl(60_000)}`)
  })

  it('antes de atrasar, fala do vencimento', () => {
    expect(mensagemDeCobranca(nota({ previsao: HOJE }), 'Cliente', HOJE)).toContain('vence hoje')
    expect(mensagemDeCobranca(nota({ previsao: '2026-11-20' }), 'Cliente', HOJE)).toContain('vence em 20/11/2026')
  })

  it('não existe para nota recebida ou cancelada', () => {
    expect(mensagemDeCobranca(nota({ recebimento: { data: '2026-10-25', valor: 100_000 } }), 'Cliente', HOJE)).toBeUndefined()
    expect(mensagemDeCobranca(nota({ cancelada: true }), 'Cliente', HOJE)).toBeUndefined()
  })
})

describe('frase do topo', () => {
  it('fala do que pede ação', () => {
    expect(fraseDoCiclo(quantidades({ 'a-faturar': 3, atrasadas: 18, recebidas: 7 }))).toBe('3 parcelas para faturar e 18 notas atrasadas.')
    expect(fraseDoCiclo(quantidades({ 'a-faturar': 1, hoje: 2, atrasadas: 1 }))).toBe('1 parcela para faturar, 2 notas vencem hoje e 1 nota atrasada.')
  })

  it('sem pendência, diz que está em dia', () => {
    expect(fraseDoCiclo(quantidades({ 'a-vencer': 4 }))).toBe('Nada para faturar ou cobrar agora.')
    expect(fraseDoCiclo(quantidades({}), 'xyz')).toBe('Com “xyz”: nada para faturar ou cobrar agora.')
  })
})

import { describe, expect, it } from 'vitest'
import { somarMeses } from '@/lib/datas'
import { somarDiasUteis } from './feriados'
import { REGRAS_SVMA, calcularVencimento, gerarPrazos, situacaoPrazo } from './prazos'
import type { Processo } from './processos'

const regra = (id: string) => REGRAS_SVMA.find((r) => r.id === id)!

describe('calcularVencimento', () => {
  it('conta dias corridos e passa domingo para o próximo dia útil', () => {
    const { vencimento, explicacao } = calcularVencimento(regra('comunique-se'), '2026-11-06')
    expect(vencimento).toBe('2026-12-07')
    expect(explicacao).toContain('06/12/2026 é domingo')
  })

  it('passa feriado para o próximo dia útil', () => {
    expect(calcularVencimento(regra('comunique-se'), '2026-10-21').vencimento).toBe('2026-11-23')
  })

  it('usa o prazo escrito no ato', () => {
    expect(calcularVencimento(regra('comunique-se'), '2026-10-01', 60).vencimento).toBe('2026-11-30')
  })

  it('antecedência que cai em feriado antecipa', () => {
    expect(calcularVencimento(regra('aviso-plantio'), '2026-11-30').vencimento).toBe('2026-11-19')
  })

  it('validade em meses com antecedência', () => {
    expect(calcularVencimento(regra('parecer-validade'), '2025-06-15').vencimento).toBe('2026-11-13')
  })
})

describe('datas', () => {
  it('somarMeses respeita o último dia do mês', () => {
    expect(somarMeses('2026-01-31', 1)).toBe('2026-02-28')
  })

  it('somarDiasUteis pula fim de semana e feriado', () => {
    expect(somarDiasUteis('2026-11-13', 5)).toBe('2026-11-23')
  })
})

describe('gerarPrazos', () => {
  const processo: Processo = {
    id: 'p1',
    clienteId: 'c1',
    empreendimento: 'Teste',
    endereco: '',
    responsavel: '',
    servico: 'licenciamento',
    numeroSei: '',
    faseAtual: 3,
    eventos: [
      { id: 'e1', tipo: 'comunique_se', data: '2026-09-01', origem: 'diario' },
      { id: 'e2', tipo: 'resposta_protocolada', data: '2026-09-20', origem: 'manual' },
      { id: 'e3', tipo: 'comunique_se', data: '2026-10-20', origem: 'diario' },
    ],
  }

  it('cada resposta cumpre um único Comunique-se', () => {
    const [primeiro, segundo] = gerarPrazos(processo)
    expect(primeiro.cumpridoEm).toBe('2026-09-20')
    expect(segundo.cumpridoEm).toBeUndefined()
    expect(situacaoPrazo(segundo, '2026-11-12').situacao).toBe('proximo')
    expect(situacaoPrazo(segundo, '2026-11-25').situacao).toBe('vencido')
  })
})

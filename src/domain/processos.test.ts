import { describe, expect, it } from 'vitest'
import { faseDepoisDoEvento } from './processos'

describe('faseDepoisDoEvento', () => {
  it('avança para a fase do evento que já aconteceu', () => {
    expect(faseDepoisDoEvento(3, { tipo: 'tca_publicado', data: '2026-11-02' }, '2026-11-02')).toBe(4)
  })

  it('não volta de fase com evento de fase anterior', () => {
    expect(faseDepoisDoEvento(4, { tipo: 'comunique_se', data: '2026-11-02' }, '2026-11-02')).toBe(4)
  })

  it('evento planejado não muda a fase', () => {
    expect(faseDepoisDoEvento(4, { tipo: 'corte_planejado', data: '2026-12-01' }, '2026-11-02')).toBe(4)
  })
})

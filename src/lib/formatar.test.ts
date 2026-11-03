import { describe, expect, it } from 'vitest'
import { contar, formatarDataLonga, juntar } from './formatar'

describe('textos do resumo', () => {
  it('escreve a data por extenso', () => {
    expect(formatarDataLonga('2026-11-03')).toBe('terça, 3 de novembro')
    expect(formatarDataLonga('2027-01-10')).toBe('domingo, 10 de janeiro')
  })

  it('acerta o plural', () => {
    expect(contar(1, 'prazo vencido', 'prazos vencidos')).toBe('1 prazo vencido')
    expect(contar(0, 'prazo', 'prazos')).toBe('0 prazos')
    expect(contar(3, 'prazo', 'prazos')).toBe('3 prazos')
  })

  it('junta a lista com vírgula e "e"', () => {
    expect(juntar([])).toBe('')
    expect(juntar(['a'])).toBe('a')
    expect(juntar(['a', 'b'])).toBe('a e b')
    expect(juntar(['a', 'b', 'c'])).toBe('a, b e c')
  })
})

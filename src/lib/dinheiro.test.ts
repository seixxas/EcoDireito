import { describe, expect, it } from 'vitest'
import { centavosDoTexto } from './dinheiro'

describe('centavosDoTexto', () => {
  it('entende os formatos que as pessoas digitam', () => {
    expect(centavosDoTexto('1.234,56')).toBe(123_456)
    expect(centavosDoTexto('R$ 48.000')).toBe(4_800_000)
    expect(centavosDoTexto('1234.5')).toBe(123_450)
    expect(centavosDoTexto('abc')).toBeUndefined()
    expect(centavosDoTexto('')).toBeUndefined()
  })
})

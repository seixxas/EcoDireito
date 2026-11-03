import { describe, expect, it } from 'vitest'
import { combina } from './buscar'

describe('combina', () => {
  it('ignora acento e maiúscula', () => {
    expect(combina('jequitiba', 'Jequitibá Campo Belo')).toBe(true)
    expect(combina('LUMEN', 'Lumen Pompeia SPE Ltda')).toBe(true)
  })

  it('exige todas as palavras, em qualquer um dos textos', () => {
    expect(combina('lumen 550', 'Lumen Pompeia', 550)).toBe(true)
    expect(combina('lumen moema', 'Lumen Pompeia', 'Grupo Lumen')).toBe(false)
  })

  it('busca vazia combina com tudo', () => {
    expect(combina(undefined, 'qualquer')).toBe(true)
    expect(combina('   ', 'qualquer')).toBe(true)
  })
})

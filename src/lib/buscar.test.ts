import { describe, expect, it } from 'vitest'
import { combina } from './buscar'

describe('combina', () => {
  it('ignora acento e maiúscula', () => {
    expect(combina('jequitiba', 'Jequitibá Campo Belo')).toBe(true)
    expect(combina('LUMEN', 'Lumen Pompeia SPE Ltda')).toBe(true)
  })

  it('cada palavra buscada é o começo de uma palavra do texto', () => {
    expect(combina('jequi', 'Jequitibá Campo Belo')).toBe(true)
    expect(combina('lumen', 'Taxas e emolumentos (reembolso)')).toBe(false)
    expect(combina('ana', 'Mariana Toledo Alves', 'Vértice Santana')).toBe(false)
  })

  it('exige todas as palavras, em qualquer um dos textos', () => {
    expect(combina('lumen 550', 'Lumen Pompeia', 550)).toBe(true)
    expect(combina('lumen moema', 'Lumen Pompeia', 'Grupo Lumen')).toBe(false)
  })

  it('número com pontuação acha do mesmo jeito', () => {
    expect(combina('6027.2026/0003127', 'SEI 6027.2026/0003127-4')).toBe(true)
    expect(combina('1.250', 'R$ 1.250,00')).toBe(true)
  })

  it('busca vazia combina com tudo', () => {
    expect(combina(undefined, 'qualquer')).toBe(true)
    expect(combina('   ', 'qualquer')).toBe(true)
  })
})

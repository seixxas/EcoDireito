import { describe, expect, it } from 'vitest'
import { paginar } from './paginar'

const cem = Array.from({ length: 83 }, (_, i) => i + 1)

describe('paginar', () => {
  it('recorta a página pedida e conta o intervalo', () => {
    const p = paginar(cem, '2')
    expect(p.itens).toEqual([11, 12, 13, 14, 15, 16, 17, 18, 19, 20])
    expect(p).toMatchObject({ pagina: 2, totalPaginas: 9, total: 83, inicio: 11, fim: 20 })
  })

  it('a última página tem só o que sobra', () => {
    expect(paginar(cem, 9)).toMatchObject({ itens: [81, 82, 83], inicio: 81, fim: 83 })
  })

  it('página inválida ou fora do intervalo vira a mais próxima', () => {
    expect(paginar(cem, undefined).pagina).toBe(1)
    expect(paginar(cem, 'abc').pagina).toBe(1)
    expect(paginar(cem, '-3').pagina).toBe(1)
    expect(paginar(cem, '50').pagina).toBe(9)
  })

  it('lista vazia tem uma página e nenhum item', () => {
    expect(paginar([], 1)).toEqual({ itens: [], pagina: 1, totalPaginas: 1, total: 0, inicio: 0, fim: 0 })
  })
})

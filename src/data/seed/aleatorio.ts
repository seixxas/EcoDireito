/** Gerador pseudoaleatório determinístico (mulberry32): a mesma semente gera os mesmos dados. */
export function criarAleatorio(semente: number) {
  let estado = semente >>> 0
  const numero = () => {
    estado = (estado + 0x6d2b79f5) >>> 0
    let t = estado
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4_294_967_296
  }
  return {
    numero,
    inteiro: (min: number, max: number) => min + Math.floor(numero() * (max - min + 1)),
    chance: (probabilidade: number) => numero() < probabilidade,
    escolher: <T>(itens: readonly T[]) => itens[Math.floor(numero() * itens.length)],
  }
}

export type Aleatorio = ReturnType<typeof criarAleatorio>

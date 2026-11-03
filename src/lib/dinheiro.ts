/** Valor em centavos (inteiro). Positivo = entrada, negativo = saída. */
export type Centavos = number

export function reais(valor: number): Centavos {
  return Math.round(valor * 100)
}

export function somar(valores: Centavos[]): Centavos {
  return valores.reduce((total, valor) => total + valor, 0)
}

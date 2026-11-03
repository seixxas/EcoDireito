/** Valor em centavos (inteiro). Positivo = entrada, negativo = saída. */
export type Centavos = number

export function reais(valor: number): Centavos {
  return Math.round(valor * 100)
}

/** Lê valores digitados: "1.234,56", "1234,56", "1234.56", "R$ 1.234". */
export function centavosDoTexto(texto: string): Centavos | undefined {
  const limpo = texto.replace(/[R$\s]/g, '')
  if (!limpo) return undefined
  // Vírgula = formato brasileiro; "48.000" sem vírgula também é milhar.
  const brasileiro = limpo.includes(',') || /^\d{1,3}(\.\d{3})+$/.test(limpo)
  const decimal = brasileiro ? limpo.replace(/\./g, '').replace(',', '.') : limpo
  const valor = Number(decimal)
  return Number.isFinite(valor) ? reais(valor) : undefined
}

export function somar(valores: Centavos[]): Centavos {
  return valores.reduce((total, valor) => total + valor, 0)
}

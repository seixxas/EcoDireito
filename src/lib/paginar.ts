export const POR_PAGINA = 10

export type Pagina<T> = { itens: T[]; pagina: number; totalPaginas: number; total: number; inicio: number; fim: number }

/** Recorta a lista para a página pedida na URL (`?pagina=`). Página inválida ou fora do intervalo vira a mais próxima. */
export function paginar<T>(itens: T[], paginaDaUrl?: string | number, porPagina = POR_PAGINA): Pagina<T> {
  const total = itens.length
  const totalPaginas = Math.max(1, Math.ceil(total / porPagina))
  const pedida = Math.trunc(Number(paginaDaUrl)) || 1
  const pagina = Math.min(Math.max(pedida, 1), totalPaginas)
  const comeco = (pagina - 1) * porPagina
  const recorte = itens.slice(comeco, comeco + porPagina)
  return { itens: recorte, pagina, totalPaginas, total, inicio: total ? comeco + 1 : 0, fim: comeco + recorte.length }
}

/**
 * Toques da identidade (09/11) nas telas do Financeiro. Os efeitos comuns (`.copa`, `.relevo`, `.brilho`) ficam no globals.css;
 * aqui só o que é do Financeiro, montado com as classes do Tailwind.
 */

/** Linha fina em degradê (copa → sol) no topo do bloco dos números-chave. O bloco precisa ter canto arredondado: o `overflow-hidden` corta a linha nele. */
export const LINHA_DA_COPA =
  'relative overflow-hidden before:pointer-events-none before:absolute before:inset-x-0 before:top-0 before:h-0.5 before:bg-linear-to-r before:from-brand-700 before:via-brand-500 before:to-accent'

/** Barra de valor em degradê da marca (receita, faturado). */
export const BARRA_DA_COPA = 'bg-linear-to-r from-brand-700 to-brand-500'

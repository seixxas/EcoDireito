import type { ReactNode } from 'react'

/** Em tela estreita, cada linha vira um cartão, em vez de rolar para o lado. */
export const TABELA_EMPILHADA =
  'tabela max-[48rem]:block max-[48rem]:min-w-0 max-[48rem]:[&_tbody]:block max-[48rem]:[&_thead]:hidden max-[48rem]:[&_tr]:border-b max-[48rem]:[&_tr]:flex max-[48rem]:[&_tr]:flex-wrap max-[48rem]:[&_tr]:items-center max-[48rem]:[&_tr]:border-line max-[48rem]:[&_tr]:py-1.5 max-[48rem]:[&_td]:py-1 max-[48rem]:[&_td.num]:text-left sm:max-[48rem]:[&_td.num]:w-48 max-sm:[&_td.num]:flex max-sm:[&_td.num]:w-full max-sm:[&_td.num]:items-baseline max-sm:[&_td.num]:justify-between max-[48rem]:[&_td:first-child]:w-full'

/** Título da coluna, escrito dentro do cartão quando a tabela está empilhada. */
export function NoCartao({ children }: { children: ReactNode }) {
  return <span className="block text-xs font-semibold text-subtle min-[48rem]:hidden">{children}</span>
}

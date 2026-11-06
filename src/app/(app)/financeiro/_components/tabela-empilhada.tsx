import type { ReactNode } from 'react'

/** Com o menu ao lado, abaixo de 1340 px a tabela não cabe com a letra grande: cada linha vira um cartão, em vez de rolar para o lado. */
export const TABELA_EMPILHADA =
  'tabela max-[83.75rem]:block max-[83.75rem]:min-w-0 max-[83.75rem]:[&_tbody]:block max-[83.75rem]:[&_thead]:hidden max-[83.75rem]:[&_tr]:mb-2 max-[83.75rem]:[&_tr]:flex max-[83.75rem]:[&_tr]:flex-wrap max-[83.75rem]:[&_tr]:items-center max-[83.75rem]:[&_tr]:rounded-xl max-[83.75rem]:[&_tr]:bg-surface max-[83.75rem]:[&_tr]:py-2 max-[83.75rem]:[&_td]:py-1 max-[83.75rem]:[&_td.num]:text-left sm:max-[83.75rem]:[&_td.num]:w-48 max-sm:[&_td.num]:flex max-sm:[&_td.num]:w-full max-sm:[&_td.num]:items-baseline max-sm:[&_td.num]:justify-between max-[83.75rem]:[&_td:first-child]:w-full'

/** Título da coluna, escrito dentro do cartão quando a tabela está empilhada. */
export function NoCartao({ children }: { children: ReactNode }) {
  return <span className="block text-xs font-semibold text-subtle min-[83.75rem]:hidden">{children}</span>
}

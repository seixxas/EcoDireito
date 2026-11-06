import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'

/** Conteúdo recolhido atrás de um botão: o texto do ato, o cálculo do prazo, os movimentos da semana. */
export function Expansivel({ resumo, aberto, className, children }: { resumo: ReactNode; aberto?: boolean; className?: string; children: ReactNode }) {
  return (
    <details open={aberto} className={cn('group', className)}>
      <summary className="inline-flex min-h-13 cursor-pointer list-none items-center gap-2 rounded-md border-2 border-brand-700 bg-surface px-5 text-base font-medium text-brand-700 transition-colors hover:bg-brand-50 [&::-webkit-details-marker]:hidden">
        <span aria-hidden className="group-open:hidden">
          +
        </span>
        <span aria-hidden className="hidden group-open:inline">
          –
        </span>
        {resumo}
      </summary>
      <div className="mt-3">{children}</div>
    </details>
  )
}

/** Lista ou busca sem resultado. */
export function Vazio({ children }: { children: ReactNode }) {
  return <p className="px-4 py-10 text-center text-lg text-muted">{children}</p>
}

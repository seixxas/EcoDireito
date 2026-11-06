import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'

/** Conteúdo recolhido atrás de um link: o texto do ato, o cálculo do prazo, os movimentos da semana. */
export function Expansivel({ resumo, aberto, className, children }: { resumo: ReactNode; aberto?: boolean; className?: string; children: ReactNode }) {
  return (
    <details open={aberto} className={cn('group', className)}>
      <summary className="inline-flex min-h-6 cursor-pointer list-none items-center gap-1.5 rounded-md text-sm font-medium text-brand-700 underline decoration-brand-300 underline-offset-2 transition-colors hover:decoration-brand-700 pointer-coarse:min-h-9 [&::-webkit-details-marker]:hidden">
        <span aria-hidden className="group-open:hidden">
          +
        </span>
        <span aria-hidden className="hidden group-open:inline">
          –
        </span>
        {resumo}
      </summary>
      <div className="mt-1.5">{children}</div>
    </details>
  )
}

/** Lista ou busca sem resultado. */
export function Vazio({ children }: { children: ReactNode }) {
  return <p className="px-3 py-6 text-center text-xs text-muted">{children}</p>
}

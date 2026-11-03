import { ChevronRight } from 'lucide-react'
import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'

/** Conteúdo recolhido: o texto do ato, o cálculo do prazo, os movimentos da semana. */
export function Expansivel({ resumo, className, children }: { resumo: ReactNode; className?: string; children: ReactNode }) {
  return (
    <details className={cn('group', className)}>
      <summary className="inline-flex cursor-pointer list-none items-center gap-1 text-sm text-brand-700 hover:underline [&::-webkit-details-marker]:hidden">
        <ChevronRight className="size-4 transition-transform group-open:rotate-90" />
        {resumo}
      </summary>
      <div className="mt-2">{children}</div>
    </details>
  )
}

/** Lista ou busca sem resultado. */
export function Vazio({ children }: { children: ReactNode }) {
  return <p className="py-8 text-center text-muted">{children}</p>
}

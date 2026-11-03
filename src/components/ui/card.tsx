import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'

/** Bloco da página. `flush` tira o espaçamento interno (para tabelas e listas). */
export function Card(props: { titulo?: ReactNode; acao?: ReactNode; flush?: boolean; className?: string; children: ReactNode }) {
  const { titulo, acao, flush, className, children } = props
  return (
    <section className={cn('overflow-hidden rounded-2xl border border-line bg-surface', className)}>
      {(titulo || acao) && (
        <header className="flex items-center justify-between gap-3 border-b border-line px-5 py-3.5">
          <h2 className="font-display text-base font-semibold text-ink">{titulo}</h2>
          {acao}
        </header>
      )}
      <div className={cn(flush ? 'overflow-x-auto' : 'p-5')}>{children}</div>
    </section>
  )
}

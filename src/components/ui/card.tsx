import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'

/** Caixa para formulário ou bloco que precisa se destacar. Para listas, prefira `Secao`. `flush` tira o espaçamento interno (tabelas). */
export function Card(props: { titulo?: ReactNode; acao?: ReactNode; flush?: boolean; className?: string; children: ReactNode }) {
  const { titulo, acao, flush, className, children } = props
  return (
    <section className={cn('overflow-hidden rounded-lg border border-line bg-surface', className)}>
      {(titulo || acao) && (
        <header className="flex items-center justify-between gap-3 border-b border-line px-4 py-3">
          <h2 className="text-base font-semibold text-ink">{titulo}</h2>
          {acao}
        </header>
      )}
      <div className={cn(flush ? 'overflow-x-auto' : 'p-4')}>{children}</div>
    </section>
  )
}

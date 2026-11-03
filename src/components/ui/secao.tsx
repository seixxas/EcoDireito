import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'

/** Bloco de conteúdo sem caixa: título pequeno, ação à direita e o conteúdo. */
export function Secao({ titulo, acao, className, children }: { titulo?: ReactNode; acao?: ReactNode; className?: string; children: ReactNode }) {
  return (
    <section className={cn('mt-8 first:mt-0', className)}>
      {(titulo || acao) && (
        <div className="mb-2 flex items-baseline justify-between gap-3">
          {titulo && <h2 className="text-base font-semibold text-ink">{titulo}</h2>}
          {acao}
        </div>
      )}
      {children}
    </section>
  )
}

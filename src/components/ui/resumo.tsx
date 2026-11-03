import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'
import { COR_DO_TEXTO, type Tom } from './badge'

/** Até 4 números numa faixa só (no lugar de uma fileira de cartões). */
export function Resumo({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <dl
      className={cn(
        'grid divide-y divide-line rounded-lg border border-line bg-surface sm:auto-cols-fr sm:grid-flow-col sm:divide-x sm:divide-y-0',
        className,
      )}
    >
      {children}
    </dl>
  )
}

export function ItemResumo({ rotulo, valor, detalhe, tom = 'neutral' }: { rotulo: string; valor: ReactNode; detalhe?: ReactNode; tom?: Tom }) {
  return (
    <div className="px-4 py-3">
      <dt className="text-sm text-muted">{rotulo}</dt>
      <dd className={cn('text-xl font-semibold tabular-nums', COR_DO_TEXTO[tom])}>{valor}</dd>
      {detalhe && <dd className="text-xs text-subtle">{detalhe}</dd>}
    </div>
  )
}

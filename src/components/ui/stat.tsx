import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'
import { COR_DO_TEXTO, type Tom } from './badge'

/** Número de destaque (KPI). */
export function Stat({ rotulo, valor, detalhe, tom = 'neutral' }: { rotulo: string; valor: ReactNode; detalhe?: ReactNode; tom?: Tom }) {
  return (
    <div className="rounded-2xl border border-line bg-surface px-5 py-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-subtle">{rotulo}</p>
      <p className={cn('mt-1 font-display text-2xl font-semibold tabular-nums', COR_DO_TEXTO[tom])}>{valor}</p>
      {detalhe && <p className="mt-0.5 text-sm text-muted">{detalhe}</p>}
    </div>
  )
}

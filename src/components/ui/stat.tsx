import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'
import { COR_DO_TEXTO, type Tom } from './badge'

/** Número de destaque solto. Para vários números juntos, use `Resumo` + `ItemResumo`. */
export function Stat({ rotulo, valor, detalhe, tom = 'neutral' }: { rotulo: string; valor: ReactNode; detalhe?: ReactNode; tom?: Tom }) {
  return (
    <div className="border-l-2 border-line py-0.5 pl-4">
      <p className="text-sm text-muted">{rotulo}</p>
      <p className={cn('text-xl font-semibold tabular-nums', COR_DO_TEXTO[tom])}>{valor}</p>
      {detalhe && <p className="text-xs text-subtle">{detalhe}</p>}
    </div>
  )
}

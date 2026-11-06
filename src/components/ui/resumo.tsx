import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'
import { COR_DO_TEXTO, type Tom } from './badge'

/** Números da tela em linhas: rótulo à esquerda, valor à direita. Em duas colunas quando há espaço. */
export function Resumo({ className, children }: { className?: string; children: ReactNode }) {
  return <dl className={cn('grid grid-cols-1 gap-x-8 rounded-lg bg-painel px-4 py-1.5 md:grid-cols-2', className)}>{children}</dl>
}

export function ItemResumo({ rotulo, valor, detalhe, tom = 'neutral' }: { rotulo: string; valor: ReactNode; detalhe?: ReactNode; tom?: Tom }) {
  return (
    <div className="flex items-baseline justify-between gap-x-3 py-1 text-sm">
      <dt className="min-w-0">
        {rotulo}
        {detalhe && <small className="block text-2xs text-muted">{detalhe}</small>}
      </dt>
      <dd className={cn('shrink-0 text-right font-semibold', COR_DO_TEXTO[tom])}>{valor}</dd>
    </div>
  )
}

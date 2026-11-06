import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'
import { COR_DO_TEXTO, type Tom } from './badge'

/** Números da tela em linhas: rótulo à esquerda, valor à direita. Em duas colunas quando há espaço. */
export function Resumo({ className, children }: { className?: string; children: ReactNode }) {
  return <dl className={cn('grid grid-cols-1 gap-x-10 rounded-xl bg-painel px-6 py-5 md:grid-cols-2', className)}>{children}</dl>
}

export function ItemResumo({ rotulo, valor, detalhe, tom = 'neutral' }: { rotulo: string; valor: ReactNode; detalhe?: ReactNode; tom?: Tom }) {
  return (
    <div className="flex flex-wrap items-baseline justify-between gap-x-3 border-b border-line py-3">
      <dt className="min-w-0">
        {rotulo}
        {detalhe && <small className="block text-2xs text-muted">{detalhe}</small>}
      </dt>
      <dd className={cn('ml-auto text-right text-lg font-semibold', COR_DO_TEXTO[tom])}>{valor}</dd>
    </div>
  )
}

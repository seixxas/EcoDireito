import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'

const TONS = {
  atraso: 'bg-danger-soft [&>h2]:text-danger',
  hoje: 'bg-warn-soft [&>h2]:text-warn',
  proximos: 'bg-brand-50 [&>h2]:text-brand-700',
  neutra: 'bg-painel [&>h2]:text-ink',
  apagada: 'bg-apagado [&>h2]:text-subtle',
  diario: 'bg-info-soft [&>h2]:text-info',
} as const

export type TomZona = keyof typeof TONS

/** Bloco colorido pela urgência: vermelho atrasado, amarelo hoje, verde próximos dias. */
export function Zona({ tom = 'neutra', titulo, detalhe, acao, className, children }: { tom?: TomZona; titulo: ReactNode; detalhe?: ReactNode; acao?: ReactNode; className?: string; children: ReactNode }) {
  return (
    <section className={cn('mb-7 rounded-xl px-3 pb-2.5 pt-4 sm:px-5.5 sm:pt-5.5', TONS[tom], className)}>
      <h2 className="mb-3.5 flex flex-wrap items-baseline justify-between gap-3 text-xl font-semibold">
        <span>{titulo}</span>
        {detalhe && <small className="text-sm font-medium text-muted">{detalhe}</small>}
        {acao}
      </h2>
      {children}
    </section>
  )
}

/** Item branco de uma zona: etiqueta, título, detalhe e, à direita, os botões. */
export function Item({ etiqueta, titulo, detalhe, fim, className }: { etiqueta?: ReactNode; titulo: ReactNode; detalhe?: ReactNode; fim?: ReactNode; className?: string }) {
  return (
    <div className={cn('mb-3 grid grid-cols-1 items-center gap-x-5 gap-y-3.5 rounded-lg bg-surface px-5 py-4.5 md:grid-cols-[minmax(0,1fr)_auto]', className)}>
      <div className="min-w-0">
        {etiqueta}
        <p className={cn('text-lg font-semibold', etiqueta ? 'mt-1.5' : undefined)}>{titulo}</p>
        {detalhe && <div className="mt-0.5 text-sm text-muted">{detalhe}</div>}
      </div>
      {fim && <div className="flex flex-wrap items-center gap-3 md:justify-end">{fim}</div>}
    </div>
  )
}

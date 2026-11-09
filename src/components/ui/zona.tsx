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
    <section className={cn('mb-4 rounded-lg p-2', TONS[tom], 'bg-[linear-gradient(180deg,color-mix(in_oklab,var(--color-surface)_45%,transparent),transparent_2.5rem)]', className)}>
      <h2 className="mb-1.5 flex flex-wrap items-baseline justify-between gap-x-3 px-1 text-sm font-semibold">
        <span>{titulo}</span>
        {detalhe && <small className="text-xs font-normal text-muted">{detalhe}</small>}
        {acao}
      </h2>
      {children}
    </section>
  )
}

/** Item de uma zona: etiqueta e título na mesma linha, detalhe embaixo e, à direita, os botões. Itens seguidos ficam colados, separados por um fio. */
export function Item({ etiqueta, titulo, detalhe, fim, className }: { etiqueta?: ReactNode; titulo: ReactNode; detalhe?: ReactNode; fim?: ReactNode; className?: string }) {
  return (
    <div className={cn('mb-px flex flex-wrap items-center gap-x-4 gap-y-1.5 bg-surface px-3 py-2 first-of-type:rounded-t-md last-of-type:mb-0 last-of-type:rounded-b-md', className)}>
      <div className="min-w-0 flex-[1_1_13rem]">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
          {etiqueta}
          <p className="min-w-0 text-sm font-medium">{titulo}</p>
        </div>
        {detalhe && <div className="text-xs text-muted">{detalhe}</div>}
      </div>
      {fim && <div className="flex flex-wrap items-center gap-2">{fim}</div>}
    </div>
  )
}

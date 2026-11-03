import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'

const TONS = {
  ok: 'bg-ok-soft text-ok',
  warn: 'bg-warn-soft text-warn',
  danger: 'bg-danger-soft text-danger',
  info: 'bg-info-soft text-info',
  brand: 'bg-brand-50 text-brand-700',
  neutral: 'bg-canvas text-muted ring-1 ring-line ring-inset',
} as const

export type Tom = keyof typeof TONS

export const COR_DO_TEXTO: Record<Tom, string> = {
  ok: 'text-ok',
  warn: 'text-warn',
  danger: 'text-danger',
  info: 'text-info',
  brand: 'text-brand-700',
  neutral: 'text-ink',
}

/** Etiqueta neutra (tipo, origem). Para situação (vencido, recebido), use `Situacao`. */
export function Badge({ tom = 'neutral', className, children }: { tom?: Tom; className?: string; children: ReactNode }) {
  return (
    <span className={cn('inline-flex items-center gap-1 whitespace-nowrap rounded-md px-1.5 py-0.5 text-xs font-medium', TONS[tom], className)}>
      {children}
    </span>
  )
}

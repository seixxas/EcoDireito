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

export function Badge({ tom = 'neutral', className, children }: { tom?: Tom; className?: string; children: ReactNode }) {
  return (
    <span className={cn('inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-semibold', TONS[tom], className)}>
      {children}
    </span>
  )
}

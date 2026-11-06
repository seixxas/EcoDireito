import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'

const TONS = {
  ok: 'bg-brand-700 text-on-brand',
  warn: 'bg-accent text-on-accent',
  danger: 'bg-danger text-on-danger',
  info: 'bg-info-tag text-info',
  brand: 'border-2 border-brand-700 bg-surface text-brand-700',
  neutral: 'bg-apagado text-subtle',
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

/** Etiqueta escrita: a palavra diz a situação e a cor só reforça. */
export function Badge({ tom = 'neutral', className, children }: { tom?: Tom; className?: string; children: ReactNode }) {
  return <span className={cn('inline-flex max-w-full items-center gap-1 rounded-sm px-2.5 py-0.5 text-2xs font-semibold', TONS[tom], className)}>{children}</span>
}

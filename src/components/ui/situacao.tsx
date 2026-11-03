import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'
import type { Tom } from './badge'

const PONTO: Record<Tom, string> = {
  ok: 'bg-ok',
  warn: 'bg-accent',
  danger: 'bg-danger',
  info: 'bg-info/60',
  brand: 'bg-brand-500',
  neutral: 'bg-subtle',
}

const TEXTO: Record<Tom, string> = {
  ok: 'text-ok',
  warn: 'text-warn',
  danger: 'text-danger font-medium',
  info: 'text-info',
  brand: 'text-brand-700',
  neutral: 'text-muted',
}

/** Situação discreta: ponto colorido + texto. */
export function Situacao({ tom = 'neutral', className, children }: { tom?: Tom; className?: string; children: ReactNode }) {
  return (
    <span className={cn('inline-flex items-center gap-1.5 whitespace-nowrap text-sm', TEXTO[tom], className)}>
      <span className={cn('size-2 shrink-0 rounded-full', PONTO[tom])} />
      {children}
    </span>
  )
}

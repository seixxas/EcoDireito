import { useId } from 'react'
import { cn } from '@/lib/cn'

/**
 * O símbolo da Eco Direito: uma folha com a nervura central sobre um quadrado verde, e o sol (o amarelo do semáforo) no canto.
 * "Folha" é planta e é página: o meio ambiente e o papel do processo. O mesmo desenho está em src/app/icon.svg (favicon).
 */
export function Simbolo({ className, titulo }: { className?: string; titulo?: string }) {
  const id = useId()
  return (
    <svg viewBox="0 0 32 32" className={cn('size-8 shrink-0', className)} role={titulo ? 'img' : undefined} aria-hidden={titulo ? undefined : true} aria-label={titulo}>
      <defs>
        <linearGradient id={`${id}-fundo`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#3f9a4a" />
          <stop offset="0.55" stopColor="#1f6b26" />
          <stop offset="1" stopColor="#123d17" />
        </linearGradient>
        <linearGradient id={`${id}-folha`} x1="0" y1="1" x2="1" y2="0">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="1" stopColor="#e3f4e5" />
        </linearGradient>
      </defs>
      <rect width="32" height="32" rx="8" fill={`url(#${id}-fundo)`} />
      <rect x="1" y="1" width="30" height="15" rx="7" fill="#ffffff" opacity="0.08" />
      <circle cx="10" cy="10" r="2.6" fill="#ffc84a" />
      <path d="M8 24.5C8 14.5 14 8.5 24.5 8C24.5 18.2 18.4 24.5 8 24.5Z" fill={`url(#${id}-folha)`} />
      <path d="M6.5 26L19.5 13" stroke="#1f6b26" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M13.2 18.8L13.3 15.4M16.2 15.8L16.4 12.6M13.2 18.8L16.6 18.9M16.2 15.8L19.4 15.9" stroke="#1f6b26" strokeWidth="1.1" strokeLinecap="round" opacity="0.55" />
    </svg>
  )
}

/** Símbolo e nome. `claro` é para fundo verde (login). */
export function Logo({ className, claro, legenda = true }: { className?: string; claro?: boolean; legenda?: boolean }) {
  return (
    <span className={cn('flex items-center gap-2.5 leading-tight', className)}>
      <Simbolo className="size-9" />
      <span>
        <span className={cn('block text-lg font-bold tracking-tight', claro ? 'text-white' : 'text-ink')}>
          Eco <span className={claro ? 'text-[#bfe6c4]' : 'text-brand-500'}>Direito</span>
        </span>
        {legenda && <span className={cn('block text-2xs font-medium', claro ? 'text-white/75' : 'text-subtle')}>Consultoria ambiental</span>}
      </span>
    </span>
  )
}

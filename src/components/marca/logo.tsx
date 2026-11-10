import { cn } from '@/lib/cn'

/**
 * O símbolo da Eco Direito (logo nova, 10/11): um círculo aberto com uma folha desenhada em traço e o sol dourado no vão.
 * A cor do traço vem de `currentColor`; `claro` é para fundo verde escuro (menu, login). O mesmo desenho está em src/app/icon.svg.
 */
export function Simbolo({ className, titulo, claro }: { className?: string; titulo?: string; claro?: boolean }) {
  return (
    <svg
      viewBox="0 0 48 48"
      fill="none"
      className={cn('size-8 shrink-0', claro ? 'text-[#e8f1e0]' : 'text-brand-700', className)}
      role={titulo ? 'img' : undefined}
      aria-hidden={titulo ? undefined : true}
      aria-label={titulo}
    >
      <g stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M27.4 9.9A17 17 0 1 0 37.6 19.4" />
        <path d="M15 37C11 29 18 17 29 15C30 26 24 35 15 37Z" />
        <path d="M16 35.5L23.5 26.5" />
      </g>
      <circle cx="35.6" cy="10.5" r="3.9" fill="#d4a537" />
    </svg>
  )
}

/** Símbolo e nome. `claro` é para fundo verde escuro (menu, login, portal). */
export function Logo({ className, claro, legenda = true }: { className?: string; claro?: boolean; legenda?: boolean }) {
  return (
    <span className={cn('flex items-center gap-2.5 leading-tight', className)}>
      <Simbolo claro={claro} className="size-9" />
      <span>
        <span className={cn('block text-[0.96875rem] font-semibold tracking-tight', claro ? 'text-white' : 'text-ink')}>
          Eco <span className={claro ? 'text-brand-claro' : 'text-brand-500'}>Direito</span>
        </span>
        {legenda && <span className={cn('block text-2xs font-medium uppercase tracking-[0.12em]', claro ? 'text-white/65' : 'text-subtle')}>Consultoria ambiental</span>}
      </span>
    </span>
  )
}

import Link from 'next/link'
import { cn } from '@/lib/cn'

export type Aba = { valor: string; rotulo: string; href: string; contagem?: number }

/** Abas de seção da página, na URL (`?aba=`). Sublinhadas. */
export function Abas({ abas, ativa, className }: { abas: Aba[]; ativa: string; className?: string }) {
  return (
    <nav className={cn('mb-5 flex gap-6 overflow-x-auto border-b border-line', className)}>
      {abas.map((aba) => (
        <Link
          key={aba.valor}
          href={aba.href}
          scroll={false}
          className={cn(
            '-mb-px whitespace-nowrap border-b-2 pb-2.5 pt-1 text-sm font-medium transition-colors',
            aba.valor === ativa ? 'border-brand-700 text-ink' : 'border-transparent text-muted hover:text-ink',
          )}
        >
          {aba.rotulo}
          {aba.contagem !== undefined && <span className="ml-1.5 rounded bg-rail px-1.5 py-0.5 text-xs tabular-nums text-muted">{aba.contagem}</span>}
        </Link>
      ))}
    </nav>
  )
}

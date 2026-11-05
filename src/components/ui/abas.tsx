import { cn } from '@/lib/cn'
import { LinkRapido } from './link-rapido'

export type Aba = {
  valor: string
  rotulo: string
  href: string
  contagem?: number
  /** Segunda linha da aba (o valor em reais, no Faturamento). Com ela, as abas viram uma faixa em grade, sem rolagem. */
  detalhe?: string
  /** Pinta o detalhe de vermelho: o que está atrasado. */
  alerta?: boolean
}

/** Abas de seção da página, na URL (`?aba=`). Sublinhadas. */
export function Abas({ abas, ativa, className }: { abas: Aba[]; ativa: string; className?: string }) {
  const emGrade = abas.some((aba) => aba.detalhe)
  return (
    <nav className={cn('mb-5 border-b border-line print:hidden', emGrade ? 'grid grid-cols-2 gap-x-1 sm:grid-cols-3 xl:grid-cols-6' : 'flex gap-6 overflow-x-auto', className)}>
      {abas.map((aba) => (
        <LinkRapido
          key={aba.valor}
          href={aba.href}
          scroll={false}
          aria-current={aba.valor === ativa ? 'page' : undefined}
          className={cn(
            'whitespace-nowrap border-b-2 pb-2.5 pt-1 text-sm font-medium transition-colors',
            emGrade && 'min-w-0 rounded-t-md px-2 pt-2',
            aba.valor === ativa ? 'border-brand-700 text-ink' : 'border-transparent text-muted hover:border-brand-300 hover:text-ink',
            emGrade && aba.valor === ativa && 'bg-brand-50',
          )}
        >
          {aba.rotulo}
          {aba.contagem !== undefined && <span className="ml-1.5 rounded bg-rail px-1.5 py-0.5 text-xs tabular-nums text-muted">{aba.contagem}</span>}
          {aba.detalhe && <span className={cn('mt-1 block truncate text-base font-semibold tabular-nums', aba.alerta ? 'text-danger' : 'text-ink')}>{aba.detalhe}</span>}
        </LinkRapido>
      ))}
    </nav>
  )
}

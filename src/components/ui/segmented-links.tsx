import Link from 'next/link'
import { cn } from '@/lib/cn'

export type OpcaoFiltro = { valor: string; rotulo: string; href: string; contagem?: number }

/** Filtros por URL, num controle com borda (o ativo fica preenchido). Para seções da página, use `Abas`. */
export function SegmentedLinks({ opcoes, ativo }: { opcoes: OpcaoFiltro[]; ativo: string }) {
  return (
    <nav className="inline-flex max-w-full flex-wrap gap-0.5 rounded-lg border border-line bg-surface p-0.5">
      {opcoes.map((opcao) => (
        <Link
          key={opcao.valor}
          href={opcao.href}
          scroll={false}
          className={cn(
            'rounded-md px-3 py-1 text-sm font-medium transition-colors',
            opcao.valor === ativo ? 'bg-brand-700 text-on-brand' : 'text-muted hover:bg-brand-50 hover:text-ink',
          )}
        >
          {opcao.rotulo}
          {opcao.contagem !== undefined && <span className="ml-1.5 tabular-nums opacity-70">{opcao.contagem}</span>}
        </Link>
      ))}
    </nav>
  )
}

import Link from 'next/link'
import { cn } from '@/lib/cn'

export type OpcaoFiltro = { valor: string; rotulo: string; href: string; contagem?: number }

/** Abas de filtro que vivem na URL. */
export function SegmentedLinks({ opcoes, ativo }: { opcoes: OpcaoFiltro[]; ativo: string }) {
  return (
    <nav className="flex flex-wrap gap-1 rounded-xl border border-line bg-surface p-1">
      {opcoes.map((opcao) => (
        <Link
          key={opcao.valor}
          href={opcao.href}
          scroll={false}
          className={cn(
            'rounded-lg px-3 py-1.5 text-sm font-medium transition-colors',
            opcao.valor === ativo ? 'bg-brand-700 text-white' : 'text-muted hover:bg-canvas hover:text-ink',
          )}
        >
          {opcao.rotulo}
          {opcao.contagem !== undefined && <span className="ml-1.5 tabular-nums opacity-70">{opcao.contagem}</span>}
        </Link>
      ))}
    </nav>
  )
}

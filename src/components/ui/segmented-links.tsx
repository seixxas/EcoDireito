import Link from 'next/link'
import { cn } from '@/lib/cn'

export type OpcaoFiltro = { valor: string; rotulo: string; href: string; contagem?: number }

/** Filtros por URL, discretos. Para seções da página, use `Abas`. */
export function SegmentedLinks({ opcoes, ativo }: { opcoes: OpcaoFiltro[]; ativo: string }) {
  return (
    <nav className="flex flex-wrap gap-1">
      {opcoes.map((opcao) => (
        <Link
          key={opcao.valor}
          href={opcao.href}
          scroll={false}
          className={cn(
            'rounded-md px-2.5 py-1 text-sm transition-colors',
            opcao.valor === ativo ? 'bg-ink text-white' : 'text-muted hover:bg-rail hover:text-ink',
          )}
        >
          {opcao.rotulo}
          {opcao.contagem !== undefined && <span className="ml-1.5 tabular-nums opacity-70">{opcao.contagem}</span>}
        </Link>
      ))}
    </nav>
  )
}

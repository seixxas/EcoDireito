import { cn } from '@/lib/cn'
import { LinkRapido } from './link-rapido'

export type OpcaoFiltro = { valor: string; rotulo: string; href: string; contagem?: number }

/** Filtros por URL (o ativo fica preenchido de verde). `rotulo` é o nome do filtro, escrito ao lado. Para seções da página, use `Abas`. */
export function SegmentedLinks({ opcoes, ativo, rotulo }: { opcoes: OpcaoFiltro[]; ativo: string; rotulo?: string }) {
  return (
    <div className="flex max-w-full flex-wrap items-center gap-x-2 gap-y-1">
      {rotulo && <p className="text-sm font-medium text-muted">{rotulo}</p>}
      <nav aria-label={rotulo} className="inline-flex max-w-full flex-wrap gap-1 rounded-lg bg-rail p-0.5">
        {opcoes.map((opcao) => (
          <LinkRapido
            key={opcao.valor}
            href={opcao.href}
            scroll={false}
            aria-current={opcao.valor === ativo ? 'true' : undefined}
            className={cn(
              'inline-flex min-h-8 items-center rounded-md px-2.5 text-sm font-medium transition-colors pointer-coarse:min-h-10',
              opcao.valor === ativo ? 'bg-brand-700 text-on-brand' : 'text-brand-700 hover:bg-brand-100',
            )}
          >
            {opcao.rotulo}
            {opcao.contagem !== undefined && <span className="ml-1">({opcao.contagem})</span>}
          </LinkRapido>
        ))}
      </nav>
    </div>
  )
}

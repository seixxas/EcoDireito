import { cn } from '@/lib/cn'
import { LinkRapido } from './link-rapido'

export type OpcaoFiltro = { valor: string; rotulo: string; href: string; contagem?: number }

/** Filtros por URL (o ativo fica preenchido de verde). `rotulo` é o nome do filtro, escrito em cima. Para seções da página, use `Abas`. */
export function SegmentedLinks({ opcoes, ativo, rotulo }: { opcoes: OpcaoFiltro[]; ativo: string; rotulo?: string }) {
  return (
    <div className="max-w-full">
      {rotulo && <p className="mb-2 text-base font-semibold">{rotulo}</p>}
      <nav aria-label={rotulo} className="inline-flex max-w-full flex-wrap gap-2 rounded-lg bg-rail p-1.5">
        {opcoes.map((opcao) => (
          <LinkRapido
            key={opcao.valor}
            href={opcao.href}
            scroll={false}
            aria-current={opcao.valor === ativo ? 'true' : undefined}
            className={cn(
              'inline-flex min-h-13 items-center rounded-md px-4 text-base font-medium transition-colors',
              opcao.valor === ativo ? 'bg-brand-700 text-on-brand' : 'text-brand-700 hover:bg-brand-100',
            )}
          >
            {opcao.rotulo}
            {opcao.contagem !== undefined && <span className="ml-1.5">({opcao.contagem})</span>}
          </LinkRapido>
        ))}
      </nav>
    </div>
  )
}

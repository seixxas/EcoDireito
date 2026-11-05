import { ChevronLeft, ChevronRight } from 'lucide-react'
import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'
import type { Pagina } from '@/lib/paginar'
import { LinkRapido } from './link-rapido'

/** Páginas a mostrar: a primeira, a última e as vizinhas da atual; `null` vira "…". */
function numeros(pagina: number, total: number) {
  const lista: (number | null)[] = []
  for (let n = 1; n <= total; n++) {
    if (n === 1 || n === total || Math.abs(n - pagina) <= 1) lista.push(n)
    else if (lista.at(-1) !== null) lista.push(null)
  }
  return lista
}

const BOTAO = 'inline-flex h-8 min-w-8 items-center justify-center gap-1 rounded-md border px-2 text-sm transition-colors'

function Passo({ href, children }: { href?: string; children: ReactNode }) {
  if (!href) return <span className={cn(BOTAO, 'border-line text-subtle')}>{children}</span>
  return (
    <LinkRapido href={href} scroll={false} className={cn(BOTAO, 'border-line bg-surface text-ink hover:border-brand-300 hover:bg-brand-50')}>
      {children}
    </LinkRapido>
  )
}

/** "11–20 de 83" e os botões de página. Some quando tudo cabe numa página. `href(n)` monta a URL mantendo os outros filtros. */
export function Paginacao({ pagina, totalPaginas, total, inicio, fim, href }: Omit<Pagina<unknown>, 'itens'> & { href: (pagina: number) => string }) {
  if (totalPaginas <= 1) return null
  return (
    <nav aria-label="Páginas" className="mt-3 flex flex-wrap items-center justify-between gap-3">
      <p className="text-sm text-muted">
        {inicio}–{fim} de {total}
      </p>
      <div className="flex items-center gap-1">
        <Passo href={pagina > 1 ? href(pagina - 1) : undefined}>
          <ChevronLeft className="size-4" />
          <span className="max-sm:hidden">Anterior</span>
        </Passo>
        {numeros(pagina, totalPaginas).map((n, i) =>
          n === null ? (
            <span key={`r${i}`} className="px-1 text-subtle">
              …
            </span>
          ) : n === pagina ? (
            <span key={n} aria-current="page" className={cn(BOTAO, 'border-brand-700 bg-brand-700 font-medium text-on-brand')}>
              {n}
            </span>
          ) : (
            <Passo key={n} href={href(n)}>
              {n}
            </Passo>
          ),
        )}
        <Passo href={pagina < totalPaginas ? href(pagina + 1) : undefined}>
          <span className="max-sm:hidden">Próxima</span>
          <ChevronRight className="size-4" />
        </Passo>
      </div>
    </nav>
  )
}

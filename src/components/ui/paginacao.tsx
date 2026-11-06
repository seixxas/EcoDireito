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

const BOTAO = 'inline-flex min-h-13 min-w-13 items-center justify-center rounded-md border-2 px-3 text-base font-medium transition-colors'

function Passo({ href, children }: { href?: string; children: ReactNode }) {
  if (!href) return <span className={cn(BOTAO, 'border-line text-subtle')}>{children}</span>
  return (
    <LinkRapido href={href} scroll={false} className={cn(BOTAO, 'border-brand-700 bg-surface text-brand-700 hover:bg-brand-50')}>
      {children}
    </LinkRapido>
  )
}

/** "11–20 de 83" e os botões de página. Some quando tudo cabe numa página. `href(n)` monta a URL mantendo os outros filtros. */
export function Paginacao({ pagina, totalPaginas, total, inicio, fim, href }: Omit<Pagina<unknown>, 'itens'> & { href: (pagina: number) => string }) {
  if (totalPaginas <= 1) return null
  return (
    <nav aria-label="Páginas" className="mt-4 flex flex-wrap items-center justify-between gap-3">
      <p className="text-base text-muted">
        {inicio}–{fim} de {total}
      </p>
      <div className="flex flex-wrap items-center gap-2">
        <Passo href={pagina > 1 ? href(pagina - 1) : undefined}>← Anterior</Passo>
        {numeros(pagina, totalPaginas).map((n, i) =>
          n === null ? (
            <span key={`r${i}`} className="px-1 text-subtle">
              …
            </span>
          ) : n === pagina ? (
            <span key={n} aria-current="page" className={cn(BOTAO, 'border-brand-700 bg-brand-700 text-on-brand')}>
              {n}
            </span>
          ) : (
            <Passo key={n} href={href(n)}>
              {n}
            </Passo>
          ),
        )}
        <Passo href={pagina < totalPaginas ? href(pagina + 1) : undefined}>Próxima →</Passo>
      </div>
    </nav>
  )
}

import { Search, X } from 'lucide-react'
import Form from 'next/form'
import Link from 'next/link'
import { cn } from '@/lib/cn'

type Props = {
  /** O que está buscado agora (`?q=`). */
  valor?: string
  placeholder?: string
  /** Outros filtros da URL que a busca mantém (a página volta para a 1). */
  manter?: Record<string, string | undefined>
  /** Endereço da lista sem a busca, para o "Limpar". */
  limpar: string
  className?: string
}

/** Caixa de busca na URL (`?q=`). Buscar não recarrega a página, e funciona sem JavaScript. Filtre com `combina` (`src/lib/buscar.ts`). */
export function Busca({ valor, placeholder = 'Buscar', manter = {}, limpar, className }: Props) {
  return (
    <Form action={limpar.split('?')[0]} scroll={false} role="search" className={cn('flex max-w-md flex-1 items-center gap-2', className)}>
      {Object.entries(manter).map(([nome, v]) => v && <input key={nome} type="hidden" name={nome} value={v} />)}
      <label className="relative flex-1">
        <span className="sr-only">{placeholder}</span>
        <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-subtle" />
        <input
          type="search"
          key={valor}
          name="q"
          defaultValue={valor}
          placeholder={placeholder}
          className="h-9 w-full rounded-md border border-line bg-surface pl-8 pr-3 text-sm text-ink outline-none placeholder:text-subtle focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
        />
      </label>
      {valor && (
        <Link href={limpar} className="inline-flex h-9 items-center gap-1 rounded-md px-2 text-sm text-muted hover:bg-brand-50 hover:text-ink">
          <X className="size-4" /> Limpar
        </Link>
      )}
    </Form>
  )
}

import Form from 'next/form'
import Link from 'next/link'
import { cn } from '@/lib/cn'
import { classeBotao } from './form'

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
    <Form action={limpar.split('?')[0]} scroll={false} role="search" className={cn('flex w-full max-w-[26rem] flex-1 items-center gap-2', className)}>
      {Object.entries(manter).map(([nome, v]) => v && <input key={nome} type="hidden" name={nome} value={v} />)}
      <label className="block min-w-0 flex-1">
        <span className="sr-only">Buscar</span>
        <input
          type="search"
          key={valor}
          name="q"
          defaultValue={valor}
          placeholder={placeholder}
          className="min-h-9 w-full rounded-md border border-campo bg-surface px-3 text-sm text-ink outline-none placeholder:text-subtle focus:border-brand-700 focus:ring-2 focus:ring-brand-100 pointer-coarse:min-h-11"
        />
      </label>
      {valor && (
        <Link href={limpar} className={classeBotao('secundario')}>
          Limpar
        </Link>
      )}
    </Form>
  )
}

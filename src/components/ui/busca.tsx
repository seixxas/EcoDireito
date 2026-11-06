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
    <Form action={limpar.split('?')[0]} scroll={false} role="search" className={cn('flex w-full max-w-[32.5rem] flex-1 flex-wrap items-end gap-3', className)}>
      {Object.entries(manter).map(([nome, v]) => v && <input key={nome} type="hidden" name={nome} value={v} />)}
      <label className="block min-w-0 flex-1 basis-60">
        <span className="mb-2 block text-base font-medium text-ink">Buscar</span>
        <input
          type="search"
          key={valor}
          name="q"
          defaultValue={valor}
          placeholder={placeholder}
          className="min-h-14 w-full rounded-md border-2 border-campo bg-surface px-4 text-base text-ink outline-none placeholder:text-subtle focus:border-brand-700 focus:ring-3 focus:ring-brand-300"
        />
      </label>
      {valor && (
        <Link href={limpar} className={classeBotao('secundario', 'min-h-14')}>
          Limpar
        </Link>
      )}
    </Form>
  )
}

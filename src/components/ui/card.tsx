import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'

/** Bloco em verde bem claro, para formulário ou conteúdo que precisa se destacar. `flush` é para tabela: fundo branco com fio em volta, sem espaço interno, e rola para o lado em tela pequena. */
export function Card(props: { titulo?: ReactNode; acao?: ReactNode; flush?: boolean; className?: string; children: ReactNode }) {
  const { titulo, acao, flush, className, children } = props
  const comTopo = titulo || acao
  return (
    <section className={cn('overflow-hidden rounded-lg', flush ? 'border border-line bg-surface' : 'bg-painel', className)}>
      {comTopo && (
        <header className="flex flex-wrap items-center justify-between gap-2 px-4 pt-3">
          <h2 className="text-base font-semibold leading-tight text-ink">{titulo}</h2>
          {acao}
        </header>
      )}
      <div className={flush ? cn('overflow-x-auto', comTopo ? 'mt-2 border-t border-line' : undefined) : cn('px-4 pb-4', comTopo ? 'pt-2' : 'pt-3')}>{children}</div>
    </section>
  )
}

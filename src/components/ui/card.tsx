import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'

/** Bloco em verde bem claro, para formulário ou conteúdo que precisa se destacar. `flush` é para tabela: tira o espaço interno e rola para o lado em tela pequena. */
export function Card(props: { titulo?: ReactNode; acao?: ReactNode; flush?: boolean; className?: string; children: ReactNode }) {
  const { titulo, acao, flush, className, children } = props
  const comTopo = titulo || acao
  return (
    <section className={cn('overflow-hidden rounded-xl bg-painel', className)}>
      {comTopo && (
        <header className="flex flex-wrap items-center justify-between gap-3 px-6 pt-5">
          <h2 className="text-[1.5rem] font-semibold leading-tight text-ink">{titulo}</h2>
          {acao}
        </header>
      )}
      <div className={cn(flush ? 'overflow-x-auto px-3 pb-2' : cn('px-6 pb-6', comTopo ? 'pt-4' : 'pt-6'), flush && !comTopo && 'pt-1')}>{children}</div>
    </section>
  )
}

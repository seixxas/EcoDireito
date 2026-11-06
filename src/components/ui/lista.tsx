import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'
import { classeBotao } from './form'
import { LinkRapido } from './link-rapido'

/** Lista de itens brancos dentro de um bloco verde bem claro. */
export function Lista({ className, children }: { className?: string; children: ReactNode }) {
  return <ul className={cn('rounded-xl bg-painel px-3.5 pb-1.5 pt-3', className)}>{children}</ul>
}

/** Um item da lista. Com `href`, o item inteiro abre a tela e mostra o botão à direita (`acao`, "Abrir" se não disser outro). */
export function Linha({ href, acao = 'Abrir', className, children }: { href?: string; acao?: string; className?: string; children: ReactNode }) {
  const conteudo = (
    <div className={cn('flex flex-wrap items-center gap-x-5 gap-y-3 rounded-lg bg-surface px-4 py-4 transition-colors', href && 'group-hover:bg-brand-50', className)}>
      {children}
      {href && <span className={classeBotao('secundario', 'ml-auto shrink-0 group-hover:bg-brand-100')}>{acao}</span>}
    </div>
  )
  return (
    <li className="mb-2">
      {href ? (
        <LinkRapido href={href} className="group block">
          {conteudo}
        </LinkRapido>
      ) : (
        conteudo
      )}
    </li>
  )
}

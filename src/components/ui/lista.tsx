import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'
import { classeBotao } from './form'
import { LinkRapido } from './link-rapido'

/** Lista em linhas corridas, separadas por um fio fino. */
export function Lista({ className, children }: { className?: string; children: ReactNode }) {
  return <ul className={cn('divide-y divide-line overflow-hidden rounded-lg border border-line bg-surface', className)}>{children}</ul>
}

/** Um item da lista. Com `href`, o item inteiro abre a tela e mostra o botão à direita (`acao`, "Abrir" se não disser outro). */
export function Linha({ href, acao = 'Abrir', className, children }: { href?: string; acao?: string; className?: string; children: ReactNode }) {
  const conteudo = (
    <div className={cn('flex flex-wrap items-center gap-x-4 gap-y-1 px-3 py-2 text-sm transition-colors', href && 'group-hover:bg-brand-50', className)}>
      {children}
      {href && <span className={classeBotao('secundario', 'ml-auto shrink-0 group-hover:bg-brand-100', 'pequeno')}>{acao}</span>}
    </div>
  )
  return (
    <li>
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

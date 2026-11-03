import { ChevronRight } from 'lucide-react'
import Link from 'next/link'
import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'

/** Lista de linhas numa caixa com borda. */
export function Lista({ className, children }: { className?: string; children: ReactNode }) {
  return <ul className={cn('divide-y divide-line overflow-hidden rounded-lg border border-line bg-surface', className)}>{children}</ul>
}

/** Uma linha da lista. Com `href`, a linha inteira vira link: muda de cor ao passar o mouse e mostra a setinha. */
export function Linha({ href, className, children }: { href?: string; className?: string; children: ReactNode }) {
  const conteudo = (
    <div className={cn('flex items-center gap-4 px-4 py-3', className)}>
      {children}
      {href && <ChevronRight className="size-4 shrink-0 text-subtle transition-colors group-hover:text-brand-700" />}
    </div>
  )
  return (
    <li>
      {href ? (
        <Link href={href} className="group block transition-colors hover:bg-brand-50">
          {conteudo}
        </Link>
      ) : (
        conteudo
      )}
    </li>
  )
}

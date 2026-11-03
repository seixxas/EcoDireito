import Link from 'next/link'
import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'

/** Lista de linhas separadas por fio fino. */
export function Lista({ className, children }: { className?: string; children: ReactNode }) {
  return <ul className={cn('divide-y divide-line border-y border-line', className)}>{children}</ul>
}

/** Uma linha da lista. Com `href`, a linha inteira vira link. */
export function Linha({ href, className, children }: { href?: string; className?: string; children: ReactNode }) {
  const conteudo = <div className={cn('flex items-center gap-4 py-2.5', className)}>{children}</div>
  return (
    <li>
      {href ? (
        <Link href={href} className="-mx-2 block rounded-md px-2 transition-colors hover:bg-surface">
          {conteudo}
        </Link>
      ) : (
        conteudo
      )}
    </li>
  )
}

'use client'

import { useRouter } from 'next/navigation'
import { useTransition, type ReactNode } from 'react'
import { cn } from '@/lib/cn'

/**
 * Linha de tabela que abre a nota no painel. O clique vale na linha toda, menos nos links e botões dela
 * e quando a pessoa está selecionando texto. Pelo teclado, a setinha (`AbrirLinha`) faz o mesmo.
 */
export function LinhaDaNota({ href, aberta, className, children }: { href: string; aberta: boolean; className?: string; children: ReactNode }) {
  const router = useRouter()
  const [abrindo, iniciar] = useTransition()
  return (
    <tr
      className={cn('cursor-pointer', (aberta || abrindo) && 'bg-brand-50', className)}
      onClick={(evento) => {
        if ((evento.target as HTMLElement).closest('a, button') || getSelection()?.toString()) return
        iniciar(() => router.push(href, { scroll: false }))
      }}
    >
      {children}
    </tr>
  )
}

import type { ReactNode } from 'react'
import { Badge, type Tom } from './badge'

/** Situação de um item (vencido, recebido): etiqueta com a palavra escrita. */
export function Situacao({ tom = 'neutral', className, children }: { tom?: Tom; className?: string; children: ReactNode }) {
  return (
    <Badge tom={tom} className={className}>
      {children}
    </Badge>
  )
}

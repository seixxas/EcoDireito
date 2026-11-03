'use client'

import type { ReactNode } from 'react'
import { useFormStatus } from 'react-dom'
import { classeBotao, type VarianteBotao } from './form'

/** Botão de submit que trava e avisa enquanto a Server Action roda. */
export function BotaoEnviar({ children, variante, className }: { children: ReactNode; variante?: VarianteBotao; className?: string }) {
  const { pending } = useFormStatus()
  return (
    <button type="submit" disabled={pending} className={classeBotao(variante, className)}>
      {pending ? 'Salvando…' : children}
    </button>
  )
}

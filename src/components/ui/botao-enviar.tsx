'use client'

import type { ReactNode } from 'react'
import { useFormStatus } from 'react-dom'
import { classeBotao, type TamanhoBotao, type VarianteBotao } from './form'

/** Botão de submit que trava e avisa enquanto a Server Action roda. */
export function BotaoEnviar({ children, variante, tamanho, className }: { children: ReactNode; variante?: VarianteBotao; tamanho?: TamanhoBotao; className?: string }) {
  const { pending } = useFormStatus()
  return (
    <button type="submit" disabled={pending} className={classeBotao(variante, className, tamanho)}>
      {pending ? 'Salvando…' : children}
    </button>
  )
}

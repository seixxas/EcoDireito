'use client'

import { useEffect, useRef, type ReactNode } from 'react'

/** O quadro de lançamentos abre abaixo da tabela, às vezes fora da tela: traz ele para a vista a cada valor escolhido. */
export function RolarParaVista({ chave, children }: { chave: string; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const semAnimacao = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ref.current?.scrollIntoView({ behavior: semAnimacao ? 'auto' : 'smooth', block: 'nearest' })
  }, [chave])
  return <div ref={ref}>{children}</div>
}

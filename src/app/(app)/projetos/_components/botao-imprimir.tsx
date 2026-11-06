'use client'

import { classeBotao } from '@/components/ui/form'

/** Abre a impressão do navegador, que também salva em PDF. O que tem `print:hidden` fica de fora. */
export function BotaoImprimir({ children = 'Imprimir ou salvar PDF', className }: { children?: string; className?: string }) {
  return (
    <button type="button" onClick={() => window.print()} className={classeBotao('secundario', className)}>
      {children}
    </button>
  )
}

'use client'

import { Printer } from 'lucide-react'
import { classeBotao } from '@/components/ui/form'

/** Abre a impressão do navegador, que também salva em PDF. O que tem `print:hidden` fica de fora. */
export function BotaoImprimir({ children = 'Imprimir ou salvar PDF' }: { children?: string }) {
  return (
    <button type="button" onClick={() => window.print()} className={classeBotao('secundario')}>
      <Printer className="size-4" /> {children}
    </button>
  )
}

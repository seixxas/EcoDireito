'use client'

import { Download } from 'lucide-react'
import { classeBotao } from '@/components/ui/form'

/** O byte inicial (BOM) faz o Excel ler o arquivo como UTF-8 e manter os acentos. */
export function BotaoExportar({ csv, arquivo }: { csv: string; arquivo: string }) {
  const baixar = () => {
    const link = document.createElement('a')
    link.href = URL.createObjectURL(new Blob([`﻿${csv}`], { type: 'text/csv;charset=utf-8' }))
    link.download = arquivo
    link.click()
    URL.revokeObjectURL(link.href)
  }
  return (
    <button type="button" onClick={baixar} className={classeBotao()}>
      <Download className="size-4" />
      Exportar para Excel
    </button>
  )
}

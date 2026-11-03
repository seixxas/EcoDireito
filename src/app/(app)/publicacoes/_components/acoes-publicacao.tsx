'use client'

import { Check, X } from 'lucide-react'
import { useState } from 'react'

/** Demonstração: a decisão fica só na tela. Com o banco, confirmar cria o evento e os prazos. */
export function AcoesPublicacao({ temProcesso, prazos }: { temProcesso: boolean; prazos: number }) {
  const [decisao, setDecisao] = useState<'confirmada' | 'descartada'>()

  if (decisao === 'confirmada') {
    return (
      <p className="rounded-lg bg-ok-soft px-3 py-2 text-sm font-medium text-ok">
        {temProcesso ? `Evento lançado no processo e ${prazos} ${prazos === 1 ? 'prazo criado' : 'prazos criados'}.` : 'Processo novo aberto para cadastro.'}
      </p>
    )
  }
  if (decisao === 'descartada') {
    return <p className="rounded-lg bg-canvas px-3 py-2 text-sm text-muted">Descartada. Não gera prazo.</p>
  }

  return (
    <div className="flex flex-wrap gap-2">
      <button
        onClick={() => setDecisao('confirmada')}
        className="inline-flex items-center gap-1.5 rounded-lg bg-brand-700 px-3.5 py-2 text-sm font-semibold text-white hover:bg-brand-900"
      >
        <Check className="size-4" /> {temProcesso ? 'Confirmar e criar prazos' : 'Cadastrar processo'}
      </button>
      <button
        onClick={() => setDecisao('descartada')}
        className="inline-flex items-center gap-1.5 rounded-lg border border-line px-3.5 py-2 text-sm font-medium text-muted hover:bg-canvas"
      >
        <X className="size-4" /> Não é nosso
      </button>
    </div>
  )
}

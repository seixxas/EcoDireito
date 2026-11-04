'use client'

import { useRef, useState } from 'react'
import { AreaTexto, Botao } from '@/components/ui/form'

/** A mensagem fica editável; o botão copia o que estiver no campo. Nada é enviado nem registrado. */
export function MensagemDeCobranca({ texto }: { texto: string }) {
  const campo = useRef<HTMLTextAreaElement>(null)
  const [aviso, setAviso] = useState<string>()

  async function copiar() {
    try {
      await navigator.clipboard.writeText(campo.current?.value ?? texto)
      setAviso('Mensagem copiada.')
    } catch {
      setAviso('Não deu para copiar. Selecione o texto e copie à mão.')
    }
  }

  return (
    <div className="space-y-3">
      <AreaTexto ref={campo} aria-label="Mensagem de cobrança" defaultValue={texto} rows={12} />
      <Botao type="button" onClick={copiar} className="w-full">
        Copiar mensagem
      </Botao>
      {aviso && (
        <p role="status" className="text-sm text-muted">
          {aviso}
        </p>
      )}
    </div>
  )
}

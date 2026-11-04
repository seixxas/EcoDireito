'use client'

import { useActionState } from 'react'
import { BotaoEnviar } from '@/components/ui/botao-enviar'
import { MensagemFormulario } from '@/components/ui/form'
import { cancelarNota } from '../notas/actions'

export function BotaoCancelarNota({ notaId, numero }: { notaId: string; numero: number }) {
  const [estado, acao] = useActionState(cancelarNota, {})
  return (
    <form
      action={acao}
      onSubmit={(evento) => {
        if (!confirm(`Cancelar a NF ${numero}? Ela sai do faturamento e da DRE.`)) evento.preventDefault()
      }}
      className="space-y-3"
    >
      <input type="hidden" name="notaId" value={notaId} />
      <MensagemFormulario estado={estado} />
      <BotaoEnviar variante="perigo" className="w-full">
        Cancelar nota
      </BotaoEnviar>
    </form>
  )
}

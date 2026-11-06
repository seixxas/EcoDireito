'use client'

import { useActionState } from 'react'
import { BotaoConfirmar } from '@/components/ui/botao-confirmar'
import { MensagemFormulario } from '@/components/ui/form'
import { cancelarNota } from '../notas/actions'

export function BotaoCancelarNota({ notaId, numero, resumo }: { notaId: string; numero: number; resumo: string }) {
  const [estado, acao] = useActionState(cancelarNota, {})
  return (
    <form action={acao} className="space-y-2">
      <input type="hidden" name="notaId" value={notaId} />
      <MensagemFormulario estado={estado} />
      <BotaoConfirmar titulo={`Cancelar a NF ${numero}?`} oQue={resumo} consequencia="Ela sai do faturamento e da DRE." sim="Sim, cancelar a nota" className="w-full">
        Cancelar nota
      </BotaoConfirmar>
    </form>
  )
}

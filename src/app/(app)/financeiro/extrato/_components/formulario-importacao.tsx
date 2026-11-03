'use client'

import { useActionState } from 'react'
import { BotaoEnviar } from '@/components/ui/botao-enviar'
import { Campo, Entrada, MensagemFormulario } from '@/components/ui/form'
import { importarExtrato } from '../actions'

export function FormularioImportacao() {
  const [estado, acao] = useActionState(importarExtrato, {})
  return (
    <form action={acao} className="space-y-3">
      <Campo rotulo="Arquivo do banco" dica="OFX (recomendado) ou CSV. Importar o mesmo período de novo não duplica nada.">
        <Entrada name="arquivo" type="file" accept=".ofx,.csv,.txt" required className="file:mr-3 file:rounded-md file:border-0 file:bg-brand-50 file:px-2 file:py-1 file:text-brand-700" />
      </Campo>
      <MensagemFormulario estado={estado} />
      <BotaoEnviar>Importar</BotaoEnviar>
    </form>
  )
}

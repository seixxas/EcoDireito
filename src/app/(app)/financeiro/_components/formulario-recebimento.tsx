'use client'

import { useActionState } from 'react'
import { BotaoEnviar } from '@/components/ui/botao-enviar'
import { Campo, Entrada, MensagemFormulario } from '@/components/ui/form'
import { EntradaDinheiro } from './entrada-dinheiro'
import { registrarRecebimento } from '../notas/actions'

export function FormularioRecebimento({ notaId, data, valor }: { notaId: string; data: string; valor: number }) {
  const [estado, acao] = useActionState(registrarRecebimento, {})
  return (
    <form action={acao} className="space-y-4">
      <input type="hidden" name="notaId" value={notaId} />
      <Campo rotulo="Data em que entrou na conta" erro={estado.erros?.data}>
        <Entrada name="data" type="date" defaultValue={estado.valores?.data ?? data} required />
      </Campo>
      <Campo rotulo="Valor recebido" erro={estado.erros?.valor} dica="O que caiu na conta, já sem a retenção.">
        <EntradaDinheiro name="valor" centavos={estado.valores?.valor ?? valor} required />
      </Campo>
      <MensagemFormulario estado={estado} />
      <BotaoEnviar className="w-full">Registrar recebimento</BotaoEnviar>
    </form>
  )
}

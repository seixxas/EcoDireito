'use client'

import { useActionState } from 'react'
import { BotaoEnviar } from '@/components/ui/botao-enviar'
import { Campo, Entrada, MensagemFormulario } from '@/components/ui/form'
import { entrar } from '../../actions'

export function FormularioLogin({ voltar }: { voltar?: string }) {
  const [estado, acao] = useActionState(entrar, {})
  return (
    <form action={acao} className="space-y-4">
      <input type="hidden" name="voltar" value={voltar ?? ''} />
      <Campo rotulo="E-mail" erro={estado.erros?.email}>
        <Entrada name="email" type="email" autoComplete="email" required autoFocus />
      </Campo>
      <Campo rotulo="Senha" erro={estado.erros?.senha}>
        <Entrada name="senha" type="password" autoComplete="current-password" required />
      </Campo>
      <MensagemFormulario estado={estado} />
      <BotaoEnviar className="w-full">Entrar</BotaoEnviar>
    </form>
  )
}

'use client'

import { useActionState, useState } from 'react'
import { BotaoEnviar } from '@/components/ui/botao-enviar'
import { Botao, Campo, Entrada, MensagemFormulario } from '@/components/ui/form'
import { entrar } from '../../actions'

const ALTO = 'min-h-11!'

export function FormularioLogin({ voltar }: { voltar?: string }) {
  const [estado, acao] = useActionState(entrar, {})
  const [verSenha, setVerSenha] = useState(false)
  return (
    <form action={acao} className="space-y-4">
      <input type="hidden" name="voltar" value={voltar ?? ''} />
      <Campo rotulo="E-mail" erro={estado.erros?.email}>
        <Entrada name="email" type="email" autoComplete="email" defaultValue={estado.valores?.email} required autoFocus className={ALTO} />
      </Campo>
      <Campo rotulo="Senha" erro={estado.erros?.senha}>
        <span className="flex flex-wrap gap-2">
          <Entrada name="senha" type={verSenha ? 'text' : 'password'} aria-label="Senha" autoComplete="current-password" required className={`min-w-44 flex-1 ${ALTO}`} />
          <Botao type="button" variante="secundario" onClick={() => setVerSenha(!verSenha)} className={`min-w-46 grow sm:grow-0 ${ALTO}`}>
            {verSenha ? 'Esconder senha' : 'Mostrar senha'}
          </Botao>
        </span>
      </Campo>
      <MensagemFormulario estado={estado} />
      <BotaoEnviar className="mt-1 min-h-11! w-full">Entrar</BotaoEnviar>
    </form>
  )
}

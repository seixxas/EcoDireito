'use client'

import { useActionState, useState } from 'react'
import { BotaoEnviar } from '@/components/ui/botao-enviar'
import { Campo, Entrada, MensagemFormulario } from '@/components/ui/form'
import { Icone } from '@/components/ui/icone'
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
        {/* O olho fica dentro do campo, à direita; o nome do botão vai no aria-label e no title. */}
        <span className="relative flex">
          <Entrada name="senha" type={verSenha ? 'text' : 'password'} aria-label="Senha" autoComplete="current-password" required className={`w-full pr-12 ${ALTO}`} />
          <button
            type="button"
            onClick={() => setVerSenha(!verSenha)}
            aria-label={verSenha ? 'Esconder senha' : 'Mostrar senha'}
            title={verSenha ? 'Esconder senha' : 'Mostrar senha'}
            className="absolute inset-y-0 right-0 inline-flex w-11 items-center justify-center rounded-r-lg text-muted hover:text-ink"
          >
            <Icone nome={verSenha ? 'visibility_off' : 'visibility'} />
          </button>
        </span>
      </Campo>
      <MensagemFormulario estado={estado} />
      <BotaoEnviar className="mt-1 min-h-11! w-full">Entrar</BotaoEnviar>
    </form>
  )
}

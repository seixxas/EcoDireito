'use client'

import { useActionState } from 'react'
import { BotaoEnviar } from '@/components/ui/botao-enviar'
import { Campo, Entrada, MensagemFormulario } from '@/components/ui/form'
import type { Cliente } from '@/domain/processos'
import { salvarCliente } from '../actions'

export function FormularioCliente({ cliente, voltar }: { cliente?: Cliente; voltar?: string }) {
  const [estado, acao] = useActionState(salvarCliente, {})
  const digitado = estado.valores
  return (
    <form action={acao} className="max-w-xl space-y-4">
      <input type="hidden" name="id" value={cliente?.id ?? ''} />
      <input type="hidden" name="voltar" value={voltar ?? ''} />
      <Campo rotulo="Razão social ou nome" erro={estado.erros?.nome}>
        <Entrada name="nome" defaultValue={digitado?.nome ?? cliente?.nome} required autoFocus />
      </Campo>
      <Campo rotulo="CNPJ ou CPF" erro={estado.erros?.documento} dica="É por ele que o robô reconhece o cliente no Diário Oficial.">
        <Entrada name="documento" defaultValue={digitado?.documento ?? cliente?.documento} required />
      </Campo>
      <Campo rotulo="Grupo econômico" erro={estado.erros?.grupo} dica="Incorporadora dona da SPE. Opcional.">
        <Entrada name="grupo" defaultValue={digitado?.grupo ?? cliente?.grupo} />
      </Campo>
      <MensagemFormulario estado={estado} />
      <BotaoEnviar>{cliente ? 'Salvar alterações' : 'Cadastrar cliente'}</BotaoEnviar>
    </form>
  )
}

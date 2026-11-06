'use client'

import { useActionState } from 'react'
import { BotaoEnviar } from '@/components/ui/botao-enviar'
import { Card } from '@/components/ui/card'
import { Campo, classeBotao, Entrada, MensagemFormulario } from '@/components/ui/form'
import { LinkRapido } from '@/components/ui/link-rapido'
import type { Cliente } from '@/domain/processos'
import { salvarCliente } from '../actions'

export function FormularioCliente({ cliente, voltar }: { cliente?: Cliente; voltar?: string }) {
  const [estado, acao] = useActionState(salvarCliente, {})
  const digitado = estado.valores
  return (
    <form action={acao} className="space-y-3">
      <input type="hidden" name="id" value={cliente?.id ?? ''} />
      <input type="hidden" name="voltar" value={voltar ?? ''} />
      <Card titulo="Dados do cliente">
        <div className="grid items-start gap-3 md:grid-cols-3">
          <Campo rotulo="Razão social ou nome" erro={estado.erros?.nome}>
            <Entrada name="nome" defaultValue={digitado?.nome ?? cliente?.nome} required autoFocus />
          </Campo>
          <Campo rotulo="CNPJ ou CPF" erro={estado.erros?.documento} dica="É por ele que o robô reconhece o cliente no Diário Oficial.">
            <Entrada name="documento" defaultValue={digitado?.documento ?? cliente?.documento} required />
          </Campo>
          <Campo rotulo="Grupo econômico" erro={estado.erros?.grupo} dica="Incorporadora dona da SPE. Opcional.">
            <Entrada name="grupo" defaultValue={digitado?.grupo ?? cliente?.grupo} />
          </Campo>
        </div>
      </Card>
      <MensagemFormulario estado={estado} />
      <div className="flex flex-wrap justify-between gap-2">
        <LinkRapido href={voltar ?? '/projetos/clientes'} className={classeBotao('secundario')}>
          Cancelar
        </LinkRapido>
        <BotaoEnviar>{cliente ? 'Salvar alterações' : 'Cadastrar cliente'}</BotaoEnviar>
      </div>
    </form>
  )
}

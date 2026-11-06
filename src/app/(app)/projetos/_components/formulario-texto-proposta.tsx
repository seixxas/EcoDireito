'use client'

import { useActionState } from 'react'
import { BotaoEnviar } from '@/components/ui/botao-enviar'
import { AreaTexto, Campo, Entrada, MensagemFormulario } from '@/components/ui/form'
import type { Proposta } from '@/domain/propostas'
import { salvarTextoDaProposta } from '../../comercial/actions'

export function FormularioTextoProposta({ proposta }: { proposta: Proposta }) {
  const [estado, acao] = useActionState(salvarTextoDaProposta, {})
  return (
    <form action={acao} className="max-w-2xl space-y-5">
      <input type="hidden" name="processoId" value={proposta.processoId} />
      <Campo rotulo="O que será feito" erro={estado.erros?.escopo}>
        <AreaTexto name="escopo" defaultValue={estado.valores?.escopo ?? proposta.escopo} rows={10} required />
      </Campo>
      <Campo rotulo="Validade (dias)" erro={estado.erros?.validadeDias} dica="Contada da data em que a proposta foi criada." className="max-w-48">
        <Entrada type="number" name="validadeDias" defaultValue={estado.valores?.validadeDias ?? proposta.validadeDias} min={1} max={365} inputMode="numeric" />
      </Campo>
      <MensagemFormulario estado={estado} />
      <BotaoEnviar>Salvar o texto</BotaoEnviar>
    </form>
  )
}

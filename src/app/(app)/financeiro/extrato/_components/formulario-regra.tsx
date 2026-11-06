'use client'

import { useActionState } from 'react'
import { BotaoEnviar } from '@/components/ui/botao-enviar'
import { Campo, Entrada, MensagemFormulario, Selecao } from '@/components/ui/form'
import { SelecaoConta } from '../../_components/selecao-conta'
import { criarRegra } from '../actions'

export function FormularioRegra({ processos }: { processos: { id: string; nome: string }[] }) {
  const [estado, acao] = useActionState(criarRegra, {})
  const { valores = {}, erros = {} } = estado
  return (
    <form action={acao} className="grid gap-2 sm:grid-cols-2">
      <Campo rotulo="Se a descrição tiver" erro={erros.contem} className="sm:col-span-2">
        <Entrada name="contem" defaultValue={valores.contem} placeholder="Ex.: viveiro mata nativa" required />
      </Campo>
      <Campo rotulo="Lançar em" erro={erros.contaId}>
        <SelecaoConta name="contaId" defaultValue={valores.contaId ?? ''} required />
      </Campo>
      <Campo rotulo="Projeto">
        <Selecao name="processoId" defaultValue={valores.processoId ?? ''}>
          <option value="">Nenhum</option>
          {processos.map((p) => (
            <option key={p.id} value={p.id}>
              {p.nome}
            </option>
          ))}
        </Selecao>
      </Campo>
      <div className="flex flex-wrap items-center gap-2 sm:col-span-2">
        <BotaoEnviar variante="secundario">Salvar regra</BotaoEnviar>
        <MensagemFormulario estado={estado} />
      </div>
    </form>
  )
}

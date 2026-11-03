'use client'

import { useActionState } from 'react'
import { BotaoEnviar } from '@/components/ui/botao-enviar'
import { Campo, Entrada, MensagemFormulario, Selecao } from '@/components/ui/form'
import { EVENTOS } from '@/domain/processos'
import { EntradaDinheiro } from '../../../_components/entrada-dinheiro'
import { salvarParcela } from '../../actions'

type Parcela = { id: string; descricao: string; valor: number; gatilho: string }

/** Sem `parcela`, inclui uma nova no fim do contrato. */
export function FormularioParcela({ processoId, parcela }: { processoId: string; parcela?: Parcela }) {
  const [estado, acao] = useActionState(salvarParcela, {})
  const { valores = {}, erros = {} } = estado

  return (
    <form action={acao} className="grid flex-1 gap-3 md:grid-cols-[minmax(0,1fr)_9rem_minmax(0,16rem)_auto]">
      <input type="hidden" name="processoId" value={processoId} />
      {parcela && <input type="hidden" name="id" value={parcela.id} />}
      <Campo rotulo="Parcela" erro={erros.descricao}>
        <Entrada name="descricao" defaultValue={valores.descricao ?? parcela?.descricao} placeholder="Ex.: Emissão do LAA" required />
      </Campo>
      <Campo rotulo="Valor" erro={erros.valor}>
        <EntradaDinheiro name="valor" centavos={valores.valor ?? parcela?.valor} required />
      </Campo>
      <Campo rotulo="Libera quando" erro={erros.gatilho}>
        <Selecao name="gatilho" defaultValue={valores.gatilho ?? parcela?.gatilho ?? ''} required>
          <option value="" disabled>
            Escolha o evento
          </option>
          {Object.entries(EVENTOS).map(([tipo, { nome }]) => (
            <option key={tipo} value={tipo}>
              {nome}
            </option>
          ))}
        </Selecao>
      </Campo>
      <div className="md:pt-6">
        <BotaoEnviar variante={parcela ? 'secundario' : 'primario'}>{parcela ? 'Salvar' : 'Incluir'}</BotaoEnviar>
      </div>
      {(estado.ok || estado.erro) && (
        <div className="md:col-span-4">
          <MensagemFormulario estado={estado} />
        </div>
      )}
    </form>
  )
}

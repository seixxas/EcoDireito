'use client'

import { useActionState } from 'react'
import { BotaoEnviar } from '@/components/ui/botao-enviar'
import { Campo, Entrada, MensagemFormulario, Selecao } from '@/components/ui/form'
import { EntradaDinheiro } from '../../../_components/entrada-dinheiro'
import { registrarNota } from '../../actions'

type Opcao = { id: string; nome: string }

export type PadraoNota = {
  numero: number
  emissao: string
  previsao: string
  descricao: string
  valor?: number
  /** Vindo de uma parcela, cliente e processo já estão definidos e não aparecem como campo. */
  parcela?: { id: string; clienteId: string; processoId: string }
}

export function FormularioNota({ clientes, processos, padrao }: { clientes: Opcao[]; processos: Opcao[]; padrao: PadraoNota }) {
  const [estado, acao] = useActionState(registrarNota, {})
  const { valores = {}, erros = {} } = estado
  const { parcela } = padrao

  return (
    <form action={acao} className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {parcela ? (
        <>
          <input type="hidden" name="parcelaId" value={parcela.id} />
          <input type="hidden" name="clienteId" value={parcela.clienteId} />
          <input type="hidden" name="processoId" value={parcela.processoId} />
        </>
      ) : (
        <>
          <Campo rotulo="Cliente" erro={erros.clienteId}>
            <Selecao name="clienteId" defaultValue={valores.clienteId ?? ''} required>
              <option value="" disabled>
                Escolha
              </option>
              {clientes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nome}
                </option>
              ))}
            </Selecao>
          </Campo>
          <Campo rotulo="Processo" erro={erros.processoId} dica="Opcional. Liga a nota à margem do processo.">
            <Selecao name="processoId" defaultValue={valores.processoId ?? ''}>
              <option value="">Sem processo</option>
              {processos.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nome}
                </option>
              ))}
            </Selecao>
          </Campo>
        </>
      )}

      <Campo rotulo="Nº da NF" erro={erros.numero}>
        <Entrada name="numero" inputMode="numeric" defaultValue={valores.numero ?? padrao.numero} required />
      </Campo>
      <Campo rotulo="Emissão" erro={erros.emissao}>
        <Entrada name="emissao" type="date" defaultValue={valores.emissao ?? padrao.emissao} required />
      </Campo>
      <Campo rotulo="Serviço" erro={erros.descricao} className="sm:col-span-2">
        <Entrada name="descricao" defaultValue={valores.descricao ?? padrao.descricao} required />
      </Campo>
      <Campo rotulo="Valor da nota" erro={erros.valor}>
        <EntradaDinheiro name="valor" centavos={valores.valor ?? padrao.valor} required />
      </Campo>
      <Campo rotulo="Previsão de pagamento" erro={erros.previsao}>
        <Entrada name="previsao" type="date" defaultValue={valores.previsao ?? padrao.previsao} required />
      </Campo>
      <label className="col-span-full flex items-center gap-2 text-sm text-ink">
        <input type="checkbox" name="comRetencao" defaultChecked={valores.comRetencao === 'on'} className="size-4 accent-brand-700" />
        O cliente retém 5,5% na fonte
      </label>

      <div className="col-span-full space-y-3">
        {erros.parcelaId && <p className="text-sm text-danger">{erros.parcelaId}</p>}
        <MensagemFormulario estado={estado} />
        <BotaoEnviar>Registrar nota</BotaoEnviar>
      </div>
    </form>
  )
}

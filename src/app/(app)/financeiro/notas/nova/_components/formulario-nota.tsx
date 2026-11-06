'use client'

import { useActionState } from 'react'
import { BotaoEnviar } from '@/components/ui/botao-enviar'
import { Card } from '@/components/ui/card'
import { Campo, classeBotao, Entrada, MensagemFormulario, Selecao } from '@/components/ui/form'
import { LinkRapido } from '@/components/ui/link-rapido'
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
    <form action={acao} className="space-y-6">
      {parcela ? (
        <>
          <input type="hidden" name="parcelaId" value={parcela.id} />
          <input type="hidden" name="clienteId" value={parcela.clienteId} />
          <input type="hidden" name="processoId" value={parcela.processoId} />
        </>
      ) : (
        <Card titulo="Cliente e projeto">
          <div className="space-y-5">
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
            <Campo rotulo="Projeto" erro={erros.processoId} dica="Opcional. Liga a nota à margem do projeto.">
              <Selecao name="processoId" defaultValue={valores.processoId ?? ''}>
                <option value="">Sem projeto</option>
                {processos.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nome}
                  </option>
                ))}
              </Selecao>
            </Campo>
          </div>
        </Card>
      )}

      <Card titulo="A nota">
        <div className="grid gap-5 sm:grid-cols-2">
          <Campo rotulo="Nº da NF" erro={erros.numero}>
            <Entrada name="numero" inputMode="numeric" defaultValue={valores.numero ?? padrao.numero} required />
          </Campo>
          <Campo rotulo="Emissão" erro={erros.emissao}>
            <Entrada name="emissao" type="date" defaultValue={valores.emissao ?? padrao.emissao} required />
          </Campo>
          <Campo rotulo="Serviço" erro={erros.descricao} className="sm:col-span-2">
            <Entrada name="descricao" defaultValue={valores.descricao ?? padrao.descricao} required />
          </Campo>
        </div>
      </Card>

      <Card titulo="Valor e pagamento">
        <div className="grid gap-5 sm:grid-cols-2">
          <Campo rotulo="Valor da nota" erro={erros.valor}>
            <EntradaDinheiro name="valor" centavos={valores.valor ?? padrao.valor} required />
          </Campo>
          <Campo rotulo="Previsão de pagamento" erro={erros.previsao}>
            <Entrada name="previsao" type="date" defaultValue={valores.previsao ?? padrao.previsao} required />
          </Campo>
          <label className="flex min-h-12 items-center gap-3 text-ink sm:col-span-2">
            <input type="checkbox" name="comRetencao" defaultChecked={valores.comRetencao === 'on'} className="size-6 shrink-0 accent-brand-700" />
            O cliente retém 5,5% na fonte
          </label>
        </div>
      </Card>

      <MensagemFormulario estado={{ erro: erros.parcelaId }} />
      <MensagemFormulario estado={estado} />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <LinkRapido href="/financeiro" className={classeBotao('secundario', 'min-h-14 text-[1.25rem]')}>
          Cancelar
        </LinkRapido>
        <BotaoEnviar className="min-h-14 text-[1.25rem]">Registrar nota</BotaoEnviar>
      </div>
    </form>
  )
}

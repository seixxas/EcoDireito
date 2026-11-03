'use client'

import { useActionState, useState } from 'react'
import { BotaoEnviar } from '@/components/ui/botao-enviar'
import { AreaTexto, Campo, Entrada, MensagemFormulario, Selecao } from '@/components/ui/form'
import { EVENTOS, type Servico } from '@/domain/processos'
import { ESCOPO_PADRAO, parcelasDaProposta, VALIDADE_PADRAO } from '@/domain/propostas'
import { centavosDoTexto } from '@/lib/dinheiro'
import { brl } from '@/lib/formatar'
import { criarProposta } from '../actions'

/** Nova proposta: escolher o serviço troca o texto padrão (se ainda não foi mexido) e as parcelas. */
export function FormularioProposta({ clientes, clienteId }: { clientes: { id: string; nome: string }[]; clienteId?: string }) {
  const [estado, acao] = useActionState(criarProposta, {})
  const erros = estado.erros ?? {}
  const v = estado.valores ?? {}
  const [servico, setServico] = useState<Servico>((v.servico as Servico) ?? 'licenciamento')
  const [escopo, setEscopo] = useState(v.escopo ?? ESCOPO_PADRAO.licenciamento)
  const [valor, setValor] = useState(v.valor ?? '')
  const total = centavosDoTexto(valor)

  function trocarServico(novo: Servico) {
    if (escopo === ESCOPO_PADRAO[servico]) setEscopo(ESCOPO_PADRAO[novo])
    setServico(novo)
  }

  return (
    <form action={acao} className="max-w-3xl space-y-4">
      <Campo rotulo="Cliente" erro={erros.clienteId}>
        <Selecao name="clienteId" defaultValue={v.clienteId ?? clienteId ?? ''} required>
          <option value="" disabled>
            Escolha o cliente
          </option>
          {clientes.map((cliente) => (
            <option key={cliente.id} value={cliente.id}>
              {cliente.nome}
            </option>
          ))}
        </Selecao>
      </Campo>
      <div className="grid gap-4 sm:grid-cols-2">
        <Campo rotulo="Empreendimento" erro={erros.empreendimento}>
          <Entrada name="empreendimento" defaultValue={v.empreendimento} placeholder="Ex.: Residencial Jardim Sul" required />
        </Campo>
        <Campo rotulo="Endereço" erro={erros.endereco}>
          <Entrada name="endereco" defaultValue={v.endereco} />
        </Campo>
        <Campo rotulo="Serviço" erro={erros.servico}>
          <Selecao name="servico" value={servico} onChange={(e) => trocarServico(e.target.value as Servico)}>
            <option value="licenciamento">Licenciamento</option>
            <option value="manejo">Manejo</option>
          </Selecao>
        </Campo>
        <Campo rotulo="Responsável na Eco Direito" erro={erros.responsavel}>
          <Entrada name="responsavel" defaultValue={v.responsavel} />
        </Campo>
      </div>
      <Campo rotulo="O que será feito" erro={erros.escopo} dica="Vai no texto da proposta. Muda sozinho ao trocar o serviço, enquanto você não editar.">
        <AreaTexto name="escopo" value={escopo} onChange={(e) => setEscopo(e.target.value)} rows={4} required />
      </Campo>
      <div className="grid gap-4 sm:grid-cols-2">
        <Campo rotulo="Valor total (R$)" erro={erros.valor}>
          <Entrada name="valor" value={valor} onChange={(e) => setValor(e.target.value)} placeholder="95.000,00" inputMode="decimal" required />
        </Campo>
        <Campo rotulo="Validade (dias)" erro={erros.validadeDias} dica="Contada da data de hoje.">
          <Entrada type="number" name="validadeDias" defaultValue={v.validadeDias ?? VALIDADE_PADRAO} min={1} max={365} inputMode="numeric" />
        </Campo>
      </div>
      <div className="rounded-lg border border-line bg-canvas/60 px-4 py-3 text-sm">
        <p className="font-medium text-ink">Forma de pagamento</p>
        <ul className="mt-1 space-y-0.5 text-muted">
          {parcelasDaProposta(servico, total ?? 0).map((parcela) => (
            <li key={parcela.descricao} className="flex justify-between gap-4">
              <span>
                {parcela.descricao} <span className="text-subtle">· libera quando: {EVENTOS[parcela.gatilho].nome}</span>
              </span>
              <span className="tabular-nums text-ink">{total ? brl(parcela.valor) : '—'}</span>
            </li>
          ))}
        </ul>
        <p className="mt-2 text-xs text-subtle">As parcelas viram o contrato do processo. Dá para ajustar depois, em Financeiro &gt; Contratos.</p>
      </div>
      <MensagemFormulario estado={estado} />
      <BotaoEnviar>Criar proposta</BotaoEnviar>
    </form>
  )
}

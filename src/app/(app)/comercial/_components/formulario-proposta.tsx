'use client'

import { useActionState, useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from 'react'
import { flushSync } from 'react-dom'
import { BotaoEnviar } from '@/components/ui/botao-enviar'
import { Card } from '@/components/ui/card'
import { AreaTexto, Botao, Campo, classeBotao, Entrada, MensagemFormulario, Selecao } from '@/components/ui/form'
import { LinkRapido } from '@/components/ui/link-rapido'
import { ItemResumo } from '@/components/ui/resumo'
import { cn } from '@/lib/cn'
import { EVENTOS, type Servico } from '@/domain/processos'
import { ESCOPO_PADRAO, parcelasDaProposta, VALIDADE_PADRAO } from '@/domain/propostas'
import { centavosDoTexto } from '@/lib/dinheiro'
import { brl } from '@/lib/formatar'
import { criarProposta } from '../actions'

const PASSOS = [
  { nome: 'Cliente e serviço', campos: ['clienteId', 'empreendimento', 'endereco', 'servico', 'responsavel'] },
  { nome: 'Valor e parcelas', campos: ['valor', 'validadeDias'] },
  { nome: 'Texto da proposta', campos: ['escopo'] },
]

const BOTAO_GRANDE = 'min-h-14 whitespace-normal! py-2 text-[1.25rem]'

/**
 * Nova proposta: escolher o serviço troca o texto padrão (se ainda não foi mexido) e as parcelas.
 * Os passos são só de tela: é um formulário, com um envio, e os campos dos outros passos ficam escondidos, sem sair dele.
 */
export function FormularioProposta({ clientes, clienteId }: { clientes: { id: string; nome: string }[]; clienteId?: string }) {
  const [estado, acao] = useActionState(criarProposta, {})
  const erros = estado.erros ?? {}
  const v = estado.valores ?? {}
  const [servico, setServico] = useState<Servico>((v.servico as Servico) ?? 'licenciamento')
  const [escopo, setEscopo] = useState(v.escopo ?? ESCOPO_PADRAO.licenciamento)
  const [valor, setValor] = useState(v.valor ?? '')
  const total = centavosDoTexto(valor)
  const [passo, setPasso] = useState(0)
  const [estadoVisto, setEstadoVisto] = useState(estado)
  const formulario = useRef<HTMLFormElement>(null)

  // Erro do servidor pode ser de um campo escondido: abre o primeiro passo que tem erro.
  if (estado !== estadoVisto) {
    setEstadoVisto(estado)
    const comErro = PASSOS.findIndex(({ campos }) => campos.some((campo) => estado.erros?.[campo]))
    if (comErro >= 0) setPasso(comErro)
  }

  useEffect(() => {
    const nome = PASSOS.flatMap(({ campos }) => campos).find((campo) => estado.erros?.[campo])
    if (nome) (formulario.current?.elements.namedItem(nome) as HTMLElement | null)?.focus()
  }, [estado])

  const controles = (indice: number) => PASSOS[indice].campos.map((nome) => formulario.current?.elements.namedItem(nome) as HTMLInputElement)

  function irPara(indice: number) {
    flushSync(() => setPasso(indice))
    controles(indice)[0].focus()
  }

  /** Campo inválido escondido trava o envio em silêncio: por isso o formulário tem `noValidate` e a conferência abre o passo antes de avisar. */
  function conferirAte(ultimo: number) {
    for (let indice = 0; indice <= ultimo; indice++) {
      const invalido = controles(indice).find((controle) => !controle.checkValidity())
      if (invalido) {
        flushSync(() => setPasso(indice))
        invalido.reportValidity()
        return false
      }
    }
    return true
  }

  function avancar() {
    if (conferirAte(passo)) irPara(passo + 1)
  }

  function aoEnviar(evento: FormEvent<HTMLFormElement>) {
    if (!conferirAte(PASSOS.length - 1)) evento.preventDefault()
  }

  /** Antes do último passo não há botão de enviar: Enter num campo só avança. */
  function aoTeclar(evento: KeyboardEvent<HTMLFormElement>) {
    if (evento.key === 'Enter' && passo < PASSOS.length - 1 && evento.target instanceof HTMLInputElement) {
      evento.preventDefault()
      avancar()
    }
  }

  function trocarServico(novo: Servico) {
    if (escopo === ESCOPO_PADRAO[servico]) setEscopo(ESCOPO_PADRAO[novo])
    setServico(novo)
  }

  return (
    <>
      <ol className="mb-9 grid grid-cols-1 gap-3 sm:grid-cols-3">
        {PASSOS.map(({ nome }, indice) => (
          <li key={nome} aria-current={indice === passo ? 'step' : undefined} className={cn('rounded-lg px-4.5 py-3.5 text-sm', indice === passo ? 'bg-brand-700 text-on-brand' : 'bg-painel')}>
            <b className={cn('block text-2xs font-semibold', indice !== passo && 'text-subtle')}>
              Passo {indice + 1} de {PASSOS.length}
            </b>
            {nome}
          </li>
        ))}
      </ol>

      <form ref={formulario} action={acao} noValidate onSubmit={aoEnviar} onKeyDown={aoTeclar} className="space-y-7">
        <div hidden={passo !== 0} className="space-y-7">
          <Campo rotulo="Cliente" dica="Empresa que vai receber a proposta." erro={erros.clienteId}>
            <span className="flex flex-col gap-3 sm:flex-row">
              {/* Depois da action o React limpa o formulário e não reaplica `defaultValue` em select. A `key` recria o select com a escolha como padrão; sem ela, a escolha some. Vale também para o Serviço. */}
              <Selecao key={v.clienteId} name="clienteId" defaultValue={v.clienteId ?? clienteId ?? ''} required className="min-w-0 flex-1">
                <option value="" disabled>
                  Escolha o cliente
                </option>
                {clientes.map((cliente) => (
                  <option key={cliente.id} value={cliente.id}>
                    {cliente.nome}
                  </option>
                ))}
              </Selecao>
              <LinkRapido href={`/projetos/clientes/novo?voltar=${encodeURIComponent('/comercial/nova')}`} className={classeBotao('secundario', 'min-h-14 shrink-0')}>
                Cadastrar novo cliente
              </LinkRapido>
            </span>
          </Campo>
          <Campo rotulo="Nome da proposta" dica="Empreendimento e o que será feito. Exemplo: Bebidas Serrana · nova linha de envase." erro={erros.empreendimento}>
            <Entrada name="empreendimento" defaultValue={v.empreendimento} required />
          </Campo>
          <Campo rotulo="Endereço" erro={erros.endereco}>
            <Entrada name="endereco" defaultValue={v.endereco} />
          </Campo>
          <Campo rotulo="Serviço" erro={erros.servico}>
            <Selecao key={v.servico} name="servico" defaultValue={servico} onChange={(e) => trocarServico(e.target.value as Servico)}>
              <option value="licenciamento">Licenciamento</option>
              <option value="manejo">Manejo</option>
            </Selecao>
          </Campo>
          <Campo rotulo="Responsável na Eco Direito" erro={erros.responsavel}>
            <Entrada name="responsavel" defaultValue={v.responsavel} />
          </Campo>
        </div>

        <div hidden={passo !== 1} className="space-y-7">
          <Campo rotulo="Valor total (R$)" erro={erros.valor}>
            <Entrada name="valor" value={valor} onChange={(e) => setValor(e.target.value)} placeholder="95.000,00" inputMode="decimal" required />
          </Campo>
          <Campo rotulo="Validade (dias)" erro={erros.validadeDias} dica="Contada da data de hoje.">
            <Entrada type="number" name="validadeDias" defaultValue={v.validadeDias ?? VALIDADE_PADRAO} min={1} max={365} inputMode="numeric" />
          </Campo>
          <Card titulo="Forma de pagamento">
            <dl>
              {parcelasDaProposta(servico, total ?? 0).map((parcela) => (
                <ItemResumo key={parcela.descricao} rotulo={parcela.descricao} detalhe={`Libera quando: ${EVENTOS[parcela.gatilho].nome}`} valor={total ? brl(parcela.valor) : '—'} />
              ))}
            </dl>
            <p className="mt-3 text-xs text-muted">As parcelas viram o contrato do projeto. Dá para ajustar depois, em Financeiro &gt; Contratos.</p>
          </Card>
        </div>

        <div hidden={passo !== 2}>
          <Campo rotulo="O que será feito" erro={erros.escopo} dica="Vai no texto da proposta. Muda sozinho ao trocar o serviço, enquanto você não editar.">
            <AreaTexto name="escopo" value={escopo} onChange={(e) => setEscopo(e.target.value)} rows={10} required />
          </Campo>
        </div>

        <MensagemFormulario estado={estado} />

        <div className="mt-10 flex flex-wrap justify-between gap-3 border-t border-line pt-6">
          {passo === 0 ? (
            <LinkRapido href="/comercial" className={classeBotao('secundario', BOTAO_GRANDE)}>
              Cancelar
            </LinkRapido>
          ) : (
            <Botao type="button" variante="secundario" onClick={() => irPara(passo - 1)} className={BOTAO_GRANDE}>
              Voltar para {PASSOS[passo - 1].nome}
            </Botao>
          )}
          {passo < PASSOS.length - 1 ? (
            <Botao type="button" onClick={avancar} className={BOTAO_GRANDE}>
              Continuar para {PASSOS[passo + 1].nome}
            </Botao>
          ) : (
            <BotaoEnviar className={BOTAO_GRANDE}>Criar proposta</BotaoEnviar>
          )}
        </div>
      </form>
    </>
  )
}

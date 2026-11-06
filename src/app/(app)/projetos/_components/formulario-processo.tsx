'use client'

import { useActionState } from 'react'
import { BotaoEnviar } from '@/components/ui/botao-enviar'
import { Card } from '@/components/ui/card'
import { Campo, classeBotao, Entrada, MensagemFormulario, Selecao } from '@/components/ui/form'
import { LinkRapido } from '@/components/ui/link-rapido'
import { FASES, type Processo } from '@/domain/processos'
import { salvarProcesso } from '../actions'

type Valores = Partial<Omit<Processo, 'eventos'>>

type Props = {
  clientes: { id: string; nome: string }[]
  valores: Valores
  /** Para onde o "Cancelar" leva. */
  cancelar: string
  /** Endereço do cadastro de cliente, com a volta para este formulário. */
  novoCliente?: string
  voltar?: string
  /** Cadastro a partir de um ato do Diário Oficial: o ato é lançado no processo ao salvar. */
  ato?: { id: string; enviar: string }
}

export function FormularioProcesso({ clientes, valores, cancelar, novoCliente, voltar, ato }: Props) {
  const [estado, acao] = useActionState(salvarProcesso, {})
  const erros = estado.erros ?? {}
  const valor = (nome: keyof Valores) => estado.valores?.[nome] ?? valores[nome]
  return (
    <form action={acao} className="space-y-6">
      <input type="hidden" name="id" value={valores.id ?? ''} />
      <input type="hidden" name="voltar" value={voltar ?? ''} />
      <input type="hidden" name="ato" value={ato?.id ?? ''} />
      <Card titulo="O projeto">
        <div className="space-y-5">
          <Campo rotulo="Nome do empreendimento" erro={erros.empreendimento} dica="É o nome que aparece em todas as telas. Exemplo: Residencial Serra Azul Lapa.">
            <Entrada name="empreendimento" defaultValue={valor('empreendimento')} required />
          </Campo>
          <Campo rotulo="Cliente" erro={erros.clienteId}>
            <span className="flex flex-wrap gap-3">
              <Selecao name="clienteId" defaultValue={valor('clienteId') ?? ''} required className="min-w-0 flex-1 basis-64">
                <option value="" disabled>
                  Escolha o cliente
                </option>
                {clientes.map((cliente) => (
                  <option key={cliente.id} value={cliente.id}>
                    {cliente.nome}
                  </option>
                ))}
              </Selecao>
              {novoCliente && (
                <LinkRapido href={novoCliente} className={classeBotao('secundario', 'min-h-14')}>
                  Cadastrar novo cliente
                </LinkRapido>
              )}
            </span>
          </Campo>
          <div className="grid gap-5 sm:grid-cols-2">
            <Campo rotulo="Endereço" erro={erros.endereco}>
              <Entrada name="endereco" defaultValue={valor('endereco')} />
            </Campo>
            <Campo rotulo="Serviço" erro={erros.servico}>
              <Selecao name="servico" defaultValue={valor('servico') ?? 'licenciamento'}>
                <option value="licenciamento">Licenciamento</option>
                <option value="manejo">Manejo</option>
              </Selecao>
            </Campo>
          </div>
        </div>
      </Card>
      <Card titulo="Na Prefeitura">
        <div className="space-y-5">
          <Campo rotulo="Nº do processo SEI" erro={erros.numeroSei} dica="Deixe vazio até abrir o processo na SVMA. É por ele que o robô acha os atos no Diário Oficial.">
            <Entrada name="numeroSei" defaultValue={valor('numeroSei')} placeholder="6027.2026/0000021-3" pattern="\d{4}\.\d{4}/\d{7}-\d" />
          </Campo>
          <div className="grid gap-5 sm:grid-cols-2">
            <Campo rotulo="Nº SIMPROC" erro={erros.numeroSimproc} dica="Só em processo antigo, aberto antes do SEI.">
              <Entrada name="numeroSimproc" defaultValue={valor('numeroSimproc')} placeholder="2016-0.084.512-3" pattern="\d{4}-0\.\d{3}\.\d{3}-\d" />
            </Campo>
            <Campo rotulo="Nº TCA" erro={erros.numeroTca} dica="Quando o Termo de Compromisso for publicado.">
              <Entrada name="numeroTca" defaultValue={valor('numeroTca')} placeholder="318/2026" />
            </Campo>
          </div>
        </div>
      </Card>
      <Card titulo="Na Eco Direito">
        <div className="grid items-end gap-5 sm:grid-cols-2">
          <Campo rotulo="Responsável" erro={erros.responsavel} dica="Quem cuida deste projeto. Aparece na lista de projetos e na tela de prazos.">
            <Entrada name="responsavel" defaultValue={valor('responsavel')} />
          </Campo>
          <Campo rotulo="Fase atual" erro={erros.faseAtual} dica="Projeto novo começa na Proposta. Depois, a fase avança sozinha quando a etapa final dela é marcada.">
            <Selecao name="faseAtual" defaultValue={valor('faseAtual') ?? 1}>
              {FASES.map((fase) => (
                <option key={fase.numero} value={fase.numero}>
                  {fase.nome} (fase {fase.numero} de {FASES.length})
                </option>
              ))}
            </Selecao>
          </Campo>
        </div>
      </Card>
      <MensagemFormulario estado={estado} />
      <div className="flex flex-wrap justify-between gap-3">
        <LinkRapido href={cancelar} className={classeBotao('secundario', 'min-h-14 text-[1.25rem]')}>
          Cancelar
        </LinkRapido>
        <BotaoEnviar className="min-h-14 text-[1.25rem]">{valores.id ? 'Salvar alterações' : (ato?.enviar ?? 'Cadastrar projeto')}</BotaoEnviar>
      </div>
    </form>
  )
}

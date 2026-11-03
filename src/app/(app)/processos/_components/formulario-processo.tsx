'use client'

import { useActionState } from 'react'
import { BotaoEnviar } from '@/components/ui/botao-enviar'
import { Campo, Entrada, MensagemFormulario, Selecao } from '@/components/ui/form'
import { FASES, type Processo } from '@/domain/processos'
import { salvarProcesso } from '../actions'

type Valores = Partial<Omit<Processo, 'eventos'>>

export function FormularioProcesso({ clientes, valores, voltar }: { clientes: { id: string; nome: string }[]; valores: Valores; voltar?: string }) {
  const [estado, acao] = useActionState(salvarProcesso, {})
  const erros = estado.erros ?? {}
  const valor = (nome: keyof Valores) => estado.valores?.[nome] ?? valores[nome]
  return (
    <form action={acao} className="max-w-3xl space-y-4">
      <input type="hidden" name="id" value={valores.id ?? ''} />
      <input type="hidden" name="voltar" value={voltar ?? ''} />
      <Campo rotulo="Cliente" erro={erros.clienteId}>
        <Selecao name="clienteId" defaultValue={valor('clienteId') ?? ''} required>
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
          <Entrada name="empreendimento" defaultValue={valor('empreendimento')} required />
        </Campo>
        <Campo rotulo="Endereço" erro={erros.endereco}>
          <Entrada name="endereco" defaultValue={valor('endereco')} />
        </Campo>
        <Campo rotulo="Responsável na Eco Direito" erro={erros.responsavel}>
          <Entrada name="responsavel" defaultValue={valor('responsavel')} />
        </Campo>
        <Campo rotulo="Serviço" erro={erros.servico}>
          <Selecao name="servico" defaultValue={valor('servico') ?? 'licenciamento'}>
            <option value="licenciamento">Licenciamento</option>
            <option value="manejo">Manejo</option>
          </Selecao>
        </Campo>
        <Campo rotulo="Nº SEI" erro={erros.numeroSei} dica="Deixe vazio até abrir o processo na SVMA. É por ele que o robô acha os atos no Diário Oficial.">
          <Entrada name="numeroSei" defaultValue={valor('numeroSei')} placeholder="6027.2026/0000021-3" pattern="\d{4}\.\d{4}/\d{7}-\d" />
        </Campo>
        <Campo rotulo="Nº SIMPROC" erro={erros.numeroSimproc} dica="Só em processo antigo, aberto antes do SEI.">
          <Entrada name="numeroSimproc" defaultValue={valor('numeroSimproc')} placeholder="2016-0.084.512-3" pattern="\d{4}-0\.\d{3}\.\d{3}-\d" />
        </Campo>
        <Campo rotulo="Nº TCA" erro={erros.numeroTca} dica="Quando o Termo de Compromisso for publicado.">
          <Entrada name="numeroTca" defaultValue={valor('numeroTca')} placeholder="318/2026" />
        </Campo>
        <Campo rotulo="Fase atual" erro={erros.faseAtual} dica="Processo novo começa na Proposta. Depois, a fase avança sozinha quando a etapa final dela é marcada.">
          <Selecao name="faseAtual" defaultValue={valor('faseAtual') ?? 1}>
            {FASES.map((fase) => (
              <option key={fase.numero} value={fase.numero}>
                {fase.numero}. {fase.nome}
              </option>
            ))}
          </Selecao>
        </Campo>
      </div>
      <MensagemFormulario estado={estado} />
      <BotaoEnviar>{valores.id ? 'Salvar alterações' : 'Cadastrar processo'}</BotaoEnviar>
    </form>
  )
}

'use client'

import { useActionState } from 'react'
import { BotaoEnviar } from '@/components/ui/botao-enviar'
import { Campo, Entrada, MensagemFormulario, Selecao } from '@/components/ui/form'
import { DICA_COMPETENCIA } from '../../_components/competencia'
import { EntradaDinheiro } from '../../_components/entrada-dinheiro'
import { SelecaoConta } from '../../_components/selecao-conta'
import { registrarLancamento } from '../actions'

export function FormularioLancamento({ hoje, processos }: { hoje: string; processos: { id: string; nome: string }[] }) {
  const [estado, acao] = useActionState(registrarLancamento, {})
  const { valores = {}, erros = {} } = estado

  return (
    <form action={acao} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <Campo rotulo="Tipo">
        <Selecao name="sentido" defaultValue={valores.sentido ?? 'saida'}>
          <option value="saida">Saída</option>
          <option value="entrada">Entrada</option>
        </Selecao>
      </Campo>
      <Campo rotulo="Data" erro={erros.data}>
        <Entrada name="data" type="date" defaultValue={valores.data ?? hoje} required />
      </Campo>
      <Campo rotulo="Valor" erro={erros.valor}>
        <EntradaDinheiro name="valor" centavos={valores.valor} required />
      </Campo>
      <Campo rotulo="Conta" erro={erros.contaId}>
        <SelecaoConta name="contaId" defaultValue={valores.contaId ?? ''} required />
      </Campo>
      <Campo rotulo="Descrição" erro={erros.descricao} className="sm:col-span-2">
        <Entrada name="descricao" defaultValue={valores.descricao} placeholder="Ex.: Viveiro Mata Nativa · plantio" required />
      </Campo>
      <Campo rotulo="Competência" erro={erros.competencia} dica={DICA_COMPETENCIA}>
        <Entrada name="competencia" type="month" defaultValue={valores.competencia} />
      </Campo>
      <Campo rotulo="Processo" dica="Opcional, para a margem do projeto.">
        <Selecao name="processoId" defaultValue={valores.processoId ?? ''}>
          <option value="">Nenhum</option>
          {processos.map((p) => (
            <option key={p.id} value={p.id}>
              {p.nome}
            </option>
          ))}
        </Selecao>
      </Campo>
      <Campo rotulo="Observação" dica="Opcional. O que a descrição não diz; entra na busca." className="sm:col-span-2 lg:col-span-4">
        <Entrada name="observacao" defaultValue={valores.observacao} placeholder="Ex.: PIX para o Guilherme referente à festa de fim de ano" />
      </Campo>
      <div className="flex flex-wrap items-center gap-3 sm:col-span-2 lg:col-span-4">
        <BotaoEnviar>Lançar</BotaoEnviar>
        <MensagemFormulario estado={estado} />
      </div>
    </form>
  )
}

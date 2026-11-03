'use client'

import { useActionState } from 'react'
import { BotaoEnviar } from '@/components/ui/botao-enviar'
import { AreaTexto, Campo, Entrada, MensagemFormulario, Selecao } from '@/components/ui/form'
import type { Lancamento } from '@/domain/financeiro/lancamentos'
import { SelecaoConta } from '../../../_components/selecao-conta'
import { editarLancamento } from '../../actions'

/** Lançamento de nota (`soObservacao`) só mostra a observação: o resto muda pela nota. */
export function FormularioEdicao({
  lancamento,
  processos,
  soObservacao,
}: {
  lancamento: Lancamento
  processos: { id: string; nome: string }[]
  soObservacao: boolean
}) {
  const [estado, acao] = useActionState(editarLancamento, {})
  const { valores = {}, erros = {} } = estado

  return (
    <form action={acao} className="space-y-4">
      <input type="hidden" name="id" value={lancamento.id} />
      {!soObservacao && (
        <>
          <Campo rotulo="Descrição" erro={erros.descricao}>
            <Entrada name="descricao" defaultValue={valores.descricao ?? lancamento.descricao} required />
          </Campo>
          <Campo rotulo="Conta" erro={erros.contaId}>
            <SelecaoConta name="contaId" defaultValue={valores.contaId ?? lancamento.contaId} required />
          </Campo>
          <div className="grid gap-4 sm:grid-cols-2">
            <Campo rotulo="Competência" erro={erros.competencia} dica="Mês da DRE. Vazio = o mês da data.">
              <Entrada name="competencia" type="month" defaultValue={valores.competencia ?? lancamento.competencia} />
            </Campo>
            <Campo rotulo="Processo">
              <Selecao name="processoId" defaultValue={valores.processoId ?? lancamento.processoId ?? ''}>
                <option value="">Nenhum</option>
                {processos.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nome}
                  </option>
                ))}
              </Selecao>
            </Campo>
          </div>
        </>
      )}
      <Campo rotulo="Observação" dica="O que a descrição do banco não diz. Aparece na lista e entra na busca.">
        <AreaTexto name="observacao" rows={3} defaultValue={valores.observacao ?? lancamento.observacao ?? ''} placeholder="Ex.: festa de fim de ano da equipe" />
      </Campo>
      <div className="flex flex-wrap items-center gap-3">
        <BotaoEnviar>Salvar</BotaoEnviar>
        <MensagemFormulario estado={estado} />
      </div>
    </form>
  )
}

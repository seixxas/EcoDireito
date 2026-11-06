'use client'

import { useActionState } from 'react'
import type { Tom } from '@/components/ui/badge'
import { BotaoEnviar } from '@/components/ui/botao-enviar'
import { Expansivel } from '@/components/ui/expansivel'
import { Campo, Entrada, MensagemFormulario, Selecao } from '@/components/ui/form'
import { Situacao } from '@/components/ui/situacao'
import { cn } from '@/lib/cn'
import { brl, formatarData } from '@/lib/formatar'
import { SelecaoConta } from '../../_components/selecao-conta'
import { classificarLinha, confirmarSugestao, ignorarLinha } from '../actions'
import { CaixaVazia } from './caixa-vazia'

type Opcao = { id: string; nome: string }

export type LinhaDaFila = {
  id: string
  data: string
  descricao: string
  valor: number
  /** `chave` vai no "Confirmar": a action só aplica se a sugestão ainda for a mesma da tela. */
  sugestao?: { texto: string; tom: Tom; chave: string }
  /** Trecho sugerido para a regra nova. */
  termo: string
  /** Notas a receber que batem com o crédito, da mais provável para a menos. */
  candidatas: string[]
}

export function FilaDoExtrato({
  linhas,
  processos,
  notas,
  editar,
  vazio,
}: {
  linhas: LinhaDaFila[]
  processos: Opcao[]
  notas: Opcao[]
  editar: boolean
  vazio?: string
}) {
  if (!linhas.length) return vazio ? <CaixaVazia titulo={vazio} /> : <CaixaVazia titulo="Nada a classificar." detalhe="Importe um extrato para começar." />
  return (
    <>
      {editar && <p className="mb-3 text-muted">“Ignorar” tira a linha da fila sem lançar (ex.: transferência entre contas da empresa).</p>}
      <ul className="rounded-xl bg-painel px-3.5 pb-1.5 pt-3">
        {linhas.map((linha) => (
          <li key={linha.id} className="mb-2 rounded-lg bg-surface px-5 py-4.5">
            <div className="flex flex-wrap items-baseline gap-x-5 gap-y-1">
              <span className="whitespace-nowrap text-muted">{formatarData(linha.data)}</span>
              <span className="min-w-48 flex-1 font-medium text-ink">{linha.descricao}</span>
              <span className={cn('whitespace-nowrap text-[1.25rem] font-semibold', linha.valor > 0 && 'text-ok')}>{brl(linha.valor)}</span>
            </div>
            <div className="mt-2.5">
              <Situacao tom={linha.sugestao?.tom ?? 'neutral'} className="whitespace-normal!">
                {linha.sugestao?.texto ?? 'Sem sugestão'}
              </Situacao>
            </div>
            {editar && (
              <div className="mt-3.5 flex flex-wrap items-center gap-3">
                {linha.sugestao && (
                  <form action={confirmarSugestao}>
                    <input type="hidden" name="linhaId" value={linha.id} />
                    <input type="hidden" name="sugestao" value={linha.sugestao.chave} />
                    <BotaoEnviar>Confirmar</BotaoEnviar>
                  </form>
                )}
                <form action={ignorarLinha}>
                  <input type="hidden" name="linhaId" value={linha.id} />
                  <BotaoEnviar variante="secundario">Ignorar</BotaoEnviar>
                </form>
                <Expansivel resumo={linha.sugestao ? 'Lançar de outro jeito' : 'Classificar'} className="open:basis-full">
                  <FormularioClassificacao linha={linha} processos={processos} notas={notas} />
                </Expansivel>
              </div>
            )}
          </li>
        ))}
      </ul>
    </>
  )
}

function FormularioClassificacao({ linha, processos, notas }: { linha: LinhaDaFila; processos: Opcao[]; notas: Opcao[] }) {
  const [estado, acao] = useActionState(classificarLinha, {})
  const { valores = {}, erros = {} } = estado
  const posicao = (nota: Opcao) => (linha.candidatas.includes(nota.id) ? linha.candidatas.indexOf(nota.id) : linha.candidatas.length)

  return (
    <form action={acao} className="grid gap-5 rounded-lg bg-painel p-5 md:grid-cols-2">
      <input type="hidden" name="linhaId" value={linha.id} />
      {linha.valor > 0 && (
        <Campo rotulo="É o recebimento da nota" erro={erros.notaId} dica="Escolha a nota ou, se o crédito não for de nota, a conta." className="md:col-span-2">
          <Selecao name="notaId" defaultValue={valores.notaId ?? ''}>
            <option value="">Não é de nota</option>
            {[...notas]
              .sort((a, b) => posicao(a) - posicao(b))
              .map((nota) => (
                <option key={nota.id} value={nota.id}>
                  {nota.nome}
                  {linha.candidatas.includes(nota.id) ? ' · bate o valor' : ''}
                </option>
              ))}
          </Selecao>
        </Campo>
      )}
      <Campo rotulo="Conta" erro={erros.contaId}>
        <SelecaoConta name="contaId" defaultValue={valores.contaId ?? ''} />
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
      <div className="space-y-2 md:col-span-2">
        <div className="flex flex-wrap items-center gap-3 text-ink">
          <label className="flex min-h-12 items-center gap-3">
            <input type="checkbox" name="lembrar" defaultChecked={valores.lembrar === 'on'} className="size-6 shrink-0 accent-brand-700" />
            Daqui em diante, lançar nesta conta tudo que tiver
          </label>
          <Entrada name="termo" defaultValue={valores.termo ?? linha.termo} aria-label="Trecho da descrição" className="w-auto min-w-48 flex-1" />
        </div>
        <MensagemFormulario estado={{ erro: erros.termo }} />
      </div>
      <div className="flex flex-wrap items-center gap-3 md:col-span-2">
        <BotaoEnviar>Lançar</BotaoEnviar>
        <MensagemFormulario estado={estado} />
      </div>
    </form>
  )
}

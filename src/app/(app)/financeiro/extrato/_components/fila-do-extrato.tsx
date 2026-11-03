'use client'

import { useActionState } from 'react'
import { Badge, type Tom } from '@/components/ui/badge'
import { BotaoEnviar } from '@/components/ui/botao-enviar'
import { Campo, Entrada, MensagemFormulario, Selecao } from '@/components/ui/form'
import { cn } from '@/lib/cn'
import { brl, formatarData } from '@/lib/formatar'
import { SelecaoConta } from '../../_components/selecao-conta'
import { classificarLinha, confirmarSugestao, ignorarLinha } from '../actions'

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

export function FilaDoExtrato({ linhas, processos, notas, editar }: { linhas: LinhaDaFila[]; processos: Opcao[]; notas: Opcao[]; editar: boolean }) {
  if (!linhas.length) return <p className="px-5 py-10 text-center text-muted">Nada a classificar. Importe um extrato para começar.</p>
  return (
    <ul className="divide-y divide-line">
      {linhas.map((linha) => (
        <li key={linha.id} className="px-5 py-4">
          <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
            <span className="w-20 text-sm text-muted">{formatarData(linha.data)}</span>
            <span className="min-w-48 flex-1 text-sm text-ink">{linha.descricao}</span>
            <span className={cn('text-sm font-semibold tabular-nums', linha.valor > 0 && 'text-ok')}>{brl(linha.valor)}</span>
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-2 sm:pl-24">
            <Badge tom={linha.sugestao?.tom ?? 'neutral'}>{linha.sugestao?.texto ?? 'Sem sugestão'}</Badge>
            {editar && linha.sugestao && (
              <form action={confirmarSugestao}>
                <input type="hidden" name="linhaId" value={linha.id} />
                <input type="hidden" name="sugestao" value={linha.sugestao.chave} />
                <BotaoEnviar variante="secundario" className="py-1">
                  Confirmar
                </BotaoEnviar>
              </form>
            )}
            {editar && (
              <form action={ignorarLinha}>
                <input type="hidden" name="linhaId" value={linha.id} />
                <button title="Tira da fila sem lançar (ex.: transferência entre contas da empresa)" className="rounded-lg px-2 py-1 text-sm text-muted hover:bg-canvas hover:text-ink">
                  Ignorar
                </button>
              </form>
            )}
          </div>
          {editar && (
            <details className="mt-2 sm:pl-24">
              <summary className="cursor-pointer text-sm font-medium text-brand-700">{linha.sugestao ? 'Lançar de outro jeito' : 'Classificar'}</summary>
              <FormularioClassificacao linha={linha} processos={processos} notas={notas} />
            </details>
          )}
        </li>
      ))}
    </ul>
  )
}

function FormularioClassificacao({ linha, processos, notas }: { linha: LinhaDaFila; processos: Opcao[]; notas: Opcao[] }) {
  const [estado, acao] = useActionState(classificarLinha, {})
  const { valores = {}, erros = {} } = estado
  const posicao = (nota: Opcao) => (linha.candidatas.includes(nota.id) ? linha.candidatas.indexOf(nota.id) : linha.candidatas.length)

  return (
    <form action={acao} className="mt-3 grid gap-3 rounded-xl bg-canvas p-4 md:grid-cols-2">
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
      <Campo rotulo="Processo">
        <Selecao name="processoId" defaultValue={valores.processoId ?? ''}>
          <option value="">Nenhum</option>
          {processos.map((p) => (
            <option key={p.id} value={p.id}>
              {p.nome}
            </option>
          ))}
        </Selecao>
      </Campo>
      <div className="space-y-1 md:col-span-2">
        <div className="flex flex-wrap items-center gap-2 text-sm text-ink">
          <label className="flex items-center gap-2">
            <input type="checkbox" name="lembrar" defaultChecked={valores.lembrar === 'on'} className="size-4 accent-brand-700" />
            Daqui em diante, lançar nesta conta tudo que tiver
          </label>
          <Entrada name="termo" defaultValue={valores.termo ?? linha.termo} aria-label="Trecho da descrição" className="w-auto min-w-48 flex-1" />
        </div>
        {erros.termo && <p className="text-xs text-danger">{erros.termo}</p>}
      </div>
      <div className="flex flex-wrap items-center gap-3 md:col-span-2">
        <BotaoEnviar>Lançar</BotaoEnviar>
        <MensagemFormulario estado={estado} />
      </div>
    </form>
  )
}

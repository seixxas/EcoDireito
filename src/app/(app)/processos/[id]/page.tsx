import { ExternalLink, Newspaper, Plus, Trash2, UserPen } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { SituacaoPrazo } from '@/components/prazos/situacao-prazo'
import { Badge, type Tom } from '@/components/ui/badge'
import { BotaoEnviar } from '@/components/ui/botao-enviar'
import { Card } from '@/components/ui/card'
import { classeBotao } from '@/components/ui/form'
import { PageHeader } from '@/components/ui/page-header'
import { hoje } from '@/data/hoje'
import { obterProcesso } from '@/data/processos'
import { exigirArea } from '@/data/sessao'
import type { SituacaoParcela } from '@/domain/financeiro/parcelas'
import { TIPOS_PRAZO, estaAberto, proximoPrazo } from '@/domain/prazos'
import { EVENTOS, FASES } from '@/domain/processos'
import { cn } from '@/lib/cn'
import { brl, formatarData, formatarDiaEData } from '@/lib/formatar'
import { pode } from '@/lib/permissoes'
import { FormularioEvento } from '../_components/formulario-evento'
import { LinkVoltar } from '../_components/link-voltar'
import { apagarEvento } from '../actions'

export const metadata: Metadata = { title: 'Processo' }

const PARCELA: Record<SituacaoParcela, { rotulo: string; tom: Tom }> = {
  aguardando: { rotulo: 'Aguardando o evento', tom: 'neutral' },
  liberada: { rotulo: 'Pronta para faturar', tom: 'warn' },
  faturada: { rotulo: 'Faturada', tom: 'info' },
  recebida: { rotulo: 'Recebida', tom: 'ok' },
}

export default async function PaginaProcesso({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const [dia, dados, usuario] = await Promise.all([hoje(), obterProcesso(id), exigirArea('prazos')])
  if (!dados) notFound()
  const { processo, cliente, prazos, parcelas } = dados
  const editar = pode(usuario.papel, 'prazos', 'editar')

  const abertos = prazos.filter((p) => estaAberto(p, dia))
  const cumpridos = prazos.filter((p) => !estaAberto(p, dia)).reverse()
  const proximo = proximoPrazo(prazos, dia)
  const eventos = [...processo.eventos].sort((a, b) => b.data.localeCompare(a.data))

  return (
    <>
      <LinkVoltar href="/processos">Processos</LinkVoltar>
      <PageHeader
        titulo={processo.empreendimento}
        descricao={processo.endereco ? `${cliente.nome} · ${processo.endereco}` : cliente.nome}
        acoes={
          <div className="flex gap-2">
            {editar && (
              <Link href={`/processos/${processo.id}/editar`} className={classeBotao('secundario')}>
                Editar
              </Link>
            )}
            <Link
              href={`/portal/${processo.id}`}
              target="_blank"
              className="inline-flex items-center gap-2 rounded-lg border border-line bg-surface px-3.5 py-2 text-sm font-medium text-brand-700 hover:bg-brand-50"
            >
              Ver como o cliente vê <ExternalLink className="size-4" />
            </Link>
          </div>
        }
      />

      <div className="mb-6 flex flex-wrap gap-2 text-xs">
        <Badge tom="neutral">SEI {processo.numeroSei}</Badge>
        {processo.numeroSimproc && <Badge tom="neutral">SIMPROC {processo.numeroSimproc}</Badge>}
        {processo.numeroTca && <Badge tom="neutral">TCA {processo.numeroTca}</Badge>}
        <Badge tom="brand">{processo.servico === 'manejo' ? 'Manejo' : 'Licenciamento'}</Badge>
        <Badge tom="neutral">Responsável: {processo.responsavel}</Badge>
      </div>

      <ol className="mb-6 grid grid-cols-2 gap-2 sm:grid-cols-4 xl:grid-cols-7">
        {FASES.map((fase) => {
          const estado = fase.numero < processo.faseAtual ? 'feita' : fase.numero === processo.faseAtual ? 'atual' : 'futura'
          return (
            <li
              key={fase.numero}
              className={cn(
                'rounded-xl border border-line border-t-4 bg-surface p-3',
                estado === 'feita' && 'border-t-ok',
                estado === 'atual' && 'border-t-accent shadow-sm',
                estado === 'futura' && 'border-t-line',
              )}
            >
              <p className="text-[11px] font-semibold uppercase tracking-wide text-subtle">Fase {fase.numero}</p>
              <p className="font-semibold leading-tight">{fase.nome}</p>
              <p className="mt-1 text-xs text-muted">
                {estado === 'feita' ? 'Concluída' : estado === 'futura' ? 'A iniciar' : proximo ? `Próximo prazo: ${formatarDiaEData(proximo.vencimento)}` : 'Em andamento'}
              </p>
            </li>
          )
        })}
      </ol>

      <div className="grid gap-6 xl:grid-cols-5">
        <Card titulo="Prazos" className="xl:col-span-3" flush>
          <ul className="divide-y divide-line">
            {[...abertos, ...cumpridos].map((prazo) => (
              <li key={prazo.id} className={cn('px-5 py-3.5', !estaAberto(prazo, dia) && 'opacity-60')}>
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="font-medium">{prazo.regra.titulo}</p>
                    <p className="text-xs text-muted">
                      {TIPOS_PRAZO[prazo.regra.tipo]} · {prazo.regra.baseLegal}
                    </p>
                  </div>
                  <div className="text-right">
                    <SituacaoPrazo prazo={prazo} hoje={dia} />
                    <p className="mt-1 text-xs font-medium">{formatarData(prazo.vencimento)}</p>
                  </div>
                </div>
                <p className="mt-1 text-xs text-subtle">{prazo.explicacao}.</p>
              </li>
            ))}
          </ul>
        </Card>

        <Card titulo="Linha do tempo" className="xl:col-span-2">
          {editar && (
            <details className="mb-5 rounded-xl border border-line p-3 open:bg-canvas">
              <summary className={classeBotao('secundario', 'cursor-pointer list-none')}>
                <Plus className="size-4" /> Lançar evento
              </summary>
              <div className="mt-3">
                <FormularioEvento processoId={processo.id} dia={dia} />
              </div>
            </details>
          )}
          {eventos.length === 0 && <p className="text-sm text-muted">Nenhum evento ainda.</p>}
          <ol className="space-y-4">
            {eventos.map((evento) => {
              const Icone = evento.origem === 'diario' ? Newspaper : UserPen
              const planejado = evento.data > dia
              return (
                <li key={evento.id} className="flex gap-3">
                  <span className={cn('mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full', evento.origem === 'diario' ? 'bg-info-soft text-info' : 'bg-brand-50 text-brand-700')}>
                    <Icone className="size-3.5" />
                  </span>
                  <div className="flex-1">
                    <p className="text-sm font-medium">
                      {EVENTOS[evento.tipo].nome} {planejado && <Badge tom="warn">planejado</Badge>}
                    </p>
                    <p className="text-xs text-muted">
                      {formatarData(evento.data)} · {evento.origem === 'diario' ? 'Diário Oficial' : 'lançado pela equipe'}
                    </p>
                  </div>
                  {editar && (
                    <details className="relative">
                      <summary className="cursor-pointer list-none rounded p-1 text-subtle hover:text-danger" title="Apagar evento">
                        <Trash2 className="size-3.5" />
                      </summary>
                      <form action={apagarEvento.bind(null, evento.id)} className="absolute right-0 z-10 mt-1 w-56 rounded-lg border border-line bg-surface p-3 shadow-sm">
                        <p className="mb-2 text-xs text-muted">
                          Os prazos gerados por ele somem, e os que ele cumpriu voltam a ficar em aberto.
                          {evento.origem === 'diario' && ' O ato volta para a caixa de entrada do Diário Oficial.'}
                        </p>
                        <BotaoEnviar variante="perigo" className="w-full">
                          Apagar evento
                        </BotaoEnviar>
                      </form>
                    </details>
                  )}
                </li>
              )
            })}
          </ol>
        </Card>
      </div>

      <Card titulo="Contrato e cobrança" className="mt-6" flush>
        <table className="tabela">
          <thead>
            <tr>
              <th>Parcela</th>
              <th className="num">Valor</th>
              <th>Libera quando</th>
              <th>Situação</th>
              <th>Nota fiscal</th>
            </tr>
          </thead>
          <tbody>
            {parcelas.map(({ parcela, situacao, nota, liberadaEm }) => (
              <tr key={parcela.id}>
                <td className="font-medium">{parcela.descricao}</td>
                <td className="num">{brl(parcela.valor)}</td>
                <td className="text-muted">
                  {EVENTOS[parcela.gatilho].nome}
                  {liberadaEm && <span className="block text-xs text-subtle">aconteceu em {formatarData(liberadaEm)}</span>}
                </td>
                <td>
                  <Badge tom={PARCELA[situacao].tom}>{PARCELA[situacao].rotulo}</Badge>
                </td>
                <td className="text-muted">{nota ? `NF ${nota.numero} · ${formatarData(nota.emissao)}` : '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </>
  )
}

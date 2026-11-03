import { ExternalLink, Trash2 } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { LinhaPrazo } from '@/components/prazos/linha-prazo'
import { descreverSituacao } from '@/components/prazos/situacao-prazo'
import { Abas } from '@/components/ui/abas'
import { Badge, type Tom } from '@/components/ui/badge'
import { BotaoEnviar } from '@/components/ui/botao-enviar'
import { Card } from '@/components/ui/card'
import { Expansivel, Vazio } from '@/components/ui/expansivel'
import { classeBotao } from '@/components/ui/form'
import { Linha, Lista } from '@/components/ui/lista'
import { PageHeader } from '@/components/ui/page-header'
import { Secao } from '@/components/ui/secao'
import { Situacao } from '@/components/ui/situacao'
import { hoje } from '@/data/hoje'
import { obterProcesso } from '@/data/processos'
import { exigirArea } from '@/data/sessao'
import type { SituacaoParcela } from '@/domain/financeiro/parcelas'
import { estaAberto, proximoPrazo } from '@/domain/prazos'
import { EVENTOS, FASES } from '@/domain/processos'
import { cn } from '@/lib/cn'
import { brl, formatarData } from '@/lib/formatar'
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

export default async function PaginaProcesso({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ aba?: string }> }) {
  const [{ id }, { aba: pedida }] = await Promise.all([params, searchParams])
  const [dia, dados, usuario] = await Promise.all([hoje(), obterProcesso(id), exigirArea('prazos')])
  if (!dados) notFound()
  const { processo, cliente, prazos, parcelas } = dados
  const editar = pode(usuario.papel, 'prazos', 'editar')
  const editarFinanceiro = pode(usuario.papel, 'financeiro', 'editar')

  const abertos = prazos.filter((p) => estaAberto(p, dia))
  const cumpridos = prazos.filter((p) => !estaAberto(p, dia)).reverse()
  const proximo = proximoPrazo(prazos, dia)
  const eventos = [...processo.eventos].sort((a, b) => b.data.localeCompare(a.data))
  const fase = FASES[processo.faseAtual - 1]

  const abas = [
    { valor: 'prazos', rotulo: 'Prazos', contagem: abertos.length },
    { valor: 'linha-do-tempo', rotulo: 'Linha do tempo', contagem: eventos.length },
    ...(pode(usuario.papel, 'financeiro') ? [{ valor: 'cobranca', rotulo: 'Cobrança', contagem: parcelas.length }] : []),
  ].map((a) => ({ ...a, href: a.valor === 'prazos' ? `/processos/${id}` : `/processos/${id}?aba=${a.valor}` }))
  const aba = abas.find((a) => a.valor === pedida)?.valor ?? 'prazos'

  const dadosDoProcesso = [
    cliente.nome,
    processo.endereco,
    `SEI ${processo.numeroSei}`,
    processo.numeroSimproc && `SIMPROC ${processo.numeroSimproc}`,
    processo.numeroTca && `TCA ${processo.numeroTca}`,
    processo.servico === 'manejo' ? 'Manejo' : 'Licenciamento',
    processo.responsavel && `Responsável: ${processo.responsavel}`,
  ].filter(Boolean)

  return (
    <>
      <LinkVoltar href="/processos">Processos</LinkVoltar>
      <PageHeader
        titulo={processo.empreendimento}
        resumo={`Fase ${fase.numero}, ${fase.nome}. ${proximo ? `Próximo prazo: ${proximo.regra.titulo} (${descreverSituacao(proximo, dia).rotulo.toLowerCase()}).` : 'Nenhum prazo em aberto.'}`}
        acoes={
          <>
            {editar && (
              <Link href={`/processos/${processo.id}/editar`} className={classeBotao('secundario')}>
                Editar
              </Link>
            )}
            <Link href={`/portal/${processo.id}`} target="_blank" className={classeBotao('secundario')}>
              Ver como o cliente vê <ExternalLink className="size-4" />
            </Link>
          </>
        }
      />

      <p className="-mt-3 mb-5 text-sm text-muted">{dadosDoProcesso.join(' · ')}</p>

      <ol className="mb-6 grid grid-cols-7 gap-1" aria-label="Fases do processo">
        {FASES.map((f) => (
          <li key={f.numero} title={f.descricao}>
            <span className={cn('block h-1.5 rounded-full', f.numero < fase.numero ? 'bg-ok' : f.numero === fase.numero ? 'bg-accent' : 'bg-line')} />
            <span className={cn('mt-1.5 block text-xs leading-tight', f.numero === fase.numero ? 'font-medium text-ink' : 'hidden text-subtle sm:block')}>
              {f.numero}. {f.nome}
            </span>
          </li>
        ))}
      </ol>

      <Abas abas={abas} ativa={aba} />

      {aba === 'prazos' && (
        <>
          <Lista>
            {abertos.map((prazo) => (
              <LinhaPrazo key={prazo.id} prazo={prazo} hoje={dia} />
            ))}
          </Lista>
          {abertos.length === 0 && <Vazio>Nenhum prazo em aberto.</Vazio>}
          {cumpridos.length > 0 && (
            <Secao titulo="Cumpridos">
              <Expansivel resumo={cumpridos.length === 1 ? 'Mostrar o prazo cumprido' : `Mostrar os ${cumpridos.length} prazos cumpridos`}>
                <Lista>
                  {cumpridos.map((prazo) => (
                    <LinhaPrazo key={prazo.id} prazo={prazo} hoje={dia} />
                  ))}
                </Lista>
              </Expansivel>
            </Secao>
          )}
        </>
      )}

      {aba === 'linha-do-tempo' && (
        <>
          {editar && (
            <Expansivel resumo="Lançar evento" className="mb-4">
              <Card className="max-w-xl">
                <FormularioEvento processoId={processo.id} dia={dia} />
              </Card>
            </Expansivel>
          )}
          <Lista>
            {eventos.map((evento) => (
              <Linha key={evento.id} className="group">
                <span className="w-24 shrink-0 tabular-nums text-muted">{formatarData(evento.data)}</span>
                <span className="min-w-0 flex-1 text-ink">{EVENTOS[evento.tipo].nome}</span>
                {evento.data > dia && <Situacao tom="warn">planejado</Situacao>}
                <Badge>{evento.origem === 'diario' ? 'Diário Oficial' : 'Equipe'}</Badge>
                {editar && (
                  <details className="relative opacity-0 focus-within:opacity-100 group-hover:opacity-100 open:opacity-100">
                    <summary className="cursor-pointer list-none rounded p-1 text-subtle hover:text-danger [&::-webkit-details-marker]:hidden" title="Apagar evento" aria-label="Apagar evento">
                      <Trash2 className="size-4" />
                    </summary>
                    <form action={apagarEvento.bind(null, evento.id)} className="absolute right-0 z-10 mt-1 w-60 rounded-lg border border-line bg-surface p-3 shadow-sm">
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
              </Linha>
            ))}
          </Lista>
          {eventos.length === 0 && <Vazio>Nenhum evento ainda.</Vazio>}
        </>
      )}

      {aba === 'cobranca' && (
        <Secao
          titulo="Contrato"
          acao={
            editarFinanceiro && (
              <Link href={`/financeiro/contratos/${processo.id}`} className="text-sm font-medium text-brand-700 hover:underline">
                Editar contrato
              </Link>
            )
          }
        >
          {parcelas.length > 0 ? (
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
                      <Situacao tom={PARCELA[situacao].tom}>{PARCELA[situacao].rotulo}</Situacao>
                    </td>
                    <td className="text-muted">
                      {nota ? (
                        `NF ${nota.numero} · ${formatarData(nota.emissao)}`
                      ) : situacao === 'liberada' && editarFinanceiro ? (
                        <Link href={`/financeiro/notas/nova?parcela=${parcela.id}`} className="font-medium text-brand-700 hover:underline">
                          Emitir nota
                        </Link>
                      ) : (
                        '—'
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <Vazio>Nenhum contrato cadastrado para este processo.</Vazio>
          )}
        </Secao>
      )}
    </>
  )
}

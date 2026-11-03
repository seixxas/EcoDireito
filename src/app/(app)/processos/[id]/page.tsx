import { ExternalLink, Trash2 } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { LinhaPrazo } from '@/components/prazos/linha-prazo'
import { descreverSituacao } from '@/components/prazos/situacao-prazo'
import { Abas } from '@/components/ui/abas'
import { Badge, type Tom } from '@/components/ui/badge'
import { BotaoEnviar } from '@/components/ui/botao-enviar'
import { Expansivel, Vazio } from '@/components/ui/expansivel'
import { classeBotao } from '@/components/ui/form'
import { Linha, Lista } from '@/components/ui/lista'
import { PageHeader } from '@/components/ui/page-header'
import { Paginacao } from '@/components/ui/paginacao'
import { Secao } from '@/components/ui/secao'
import { Situacao } from '@/components/ui/situacao'
import { hoje } from '@/data/hoje'
import { obterProcesso } from '@/data/processos'
import { exigirArea } from '@/data/sessao'
import type { SituacaoParcela } from '@/domain/financeiro/parcelas'
import { estaAberto, proximoPrazo } from '@/domain/prazos'
import { EVENTOS, FASES, situacaoDaFase } from '@/domain/processos'
import { cn } from '@/lib/cn'
import { brl, formatarData } from '@/lib/formatar'
import { paginar } from '@/lib/paginar'
import { pode } from '@/lib/permissoes'
import { EtapasDaFase } from '../_components/etapas-da-fase'
import { PropostaDoProcesso } from '../_components/proposta-do-processo'
import { LinkVoltar } from '../_components/link-voltar'
import { apagarEvento } from '../actions'

export const metadata: Metadata = { title: 'Processo' }

const PARCELA: Record<SituacaoParcela, { rotulo: string; tom: Tom }> = {
  aguardando: { rotulo: 'Aguardando o evento', tom: 'neutral' },
  liberada: { rotulo: 'Pronta para faturar', tom: 'warn' },
  faturada: { rotulo: 'Faturada', tom: 'info' },
  recebida: { rotulo: 'Recebida', tom: 'ok' },
}

export default async function PaginaProcesso({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ aba?: string; pagina?: string; fase?: string }>
}) {
  const [{ id }, { aba: pedida, pagina, fase: fasePedida }] = await Promise.all([params, searchParams])
  const [dia, dados, usuario] = await Promise.all([hoje(), obterProcesso(id), exigirArea('prazos')])
  if (!dados) notFound()
  const { processo, cliente, prazos, parcelas, proposta, situacaoProposta } = dados
  const editar = pode(usuario.papel, 'prazos', 'editar')
  const editarFinanceiro = pode(usuario.papel, 'financeiro', 'editar')
  const recusada = situacaoProposta.estado === 'recusada'

  const abertos = prazos.filter((p) => estaAberto(p, dia))
  const cumpridos = prazos.filter((p) => !estaAberto(p, dia)).reverse()
  const proximo = proximoPrazo(prazos, dia)
  const eventos = paginar([...processo.eventos].sort((a, b) => b.data.localeCompare(a.data)), pagina)
  const fase = FASES[processo.faseAtual - 1]
  const faseVista = (FASES.find((f) => String(f.numero) === fasePedida) ?? fase).numero

  // Enquanto o processo está na Proposta, ela é a aba que abre primeiro.
  const padrao = proposta && processo.faseAtual === 1 ? 'proposta' : 'etapas'
  const abas = [
    ...(proposta ? [{ valor: 'proposta', rotulo: 'Proposta' }] : []),
    { valor: 'etapas', rotulo: 'Etapas' },
    { valor: 'prazos', rotulo: 'Prazos', contagem: abertos.length },
    { valor: 'linha-do-tempo', rotulo: 'Linha do tempo', contagem: eventos.total },
    ...(pode(usuario.papel, 'financeiro') ? [{ valor: 'cobranca', rotulo: 'Cobrança', contagem: parcelas.length }] : []),
  ].map((a) => ({ ...a, href: a.valor === padrao ? `/processos/${id}` : `/processos/${id}?aba=${a.valor}` }))
  const aba = abas.find((a) => a.valor === pedida)?.valor ?? padrao

  const dadosDoProcesso = [
    cliente.nome,
    processo.endereco,
    processo.numeroSei ? `SEI ${processo.numeroSei}` : 'Sem nº SEI (ainda não aberto na SVMA)',
    processo.numeroSimproc && `SIMPROC ${processo.numeroSimproc}`,
    processo.numeroTca && `TCA ${processo.numeroTca}`,
    processo.servico === 'manejo' ? 'Manejo' : 'Licenciamento',
    processo.responsavel && `Responsável: ${processo.responsavel}`,
  ].filter(Boolean)

  return (
    <>
      <div className="print:hidden">
        {processo.faseAtual === 1 || recusada ? <LinkVoltar href="/comercial">Comercial</LinkVoltar> : <LinkVoltar href="/processos">Processos</LinkVoltar>}
        <PageHeader
          titulo={processo.empreendimento}
          resumo={
            recusada
              ? `Proposta recusada em ${formatarData(situacaoProposta.recusadaEm!)}. Não aparece na lista de processos; fica no Comercial.`
              : `Fase ${fase.numero} de ${FASES.length}, ${fase.nome}. ${proximo ? `Próximo prazo: ${proximo.regra.titulo} (${descreverSituacao(proximo, dia).rotulo.toLowerCase()}).` : 'Nenhum prazo em aberto.'}`
          }
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

        <ol className="mb-1 grid grid-cols-8 gap-1" aria-label="Fases do processo">
          {FASES.map((f) => {
            const situacao = situacaoDaFase(processo, f.numero, dia)
            const vista = aba === 'etapas' && f.numero === faseVista
            return (
              <li key={f.numero}>
                <Link
                  href={`/processos/${id}?aba=etapas&fase=${f.numero}`}
                  scroll={false}
                  title={`Ver as etapas: ${f.descricao}`}
                  aria-current={vista ? 'step' : undefined}
                  className={cn('group block rounded-md px-1 pb-1.5 pt-1 transition-colors hover:bg-brand-50', vista && 'bg-brand-50')}
                >
                  <span className={cn('block h-1.5 rounded-full', situacao === 'concluida' ? 'bg-ok' : situacao === 'atual' ? 'bg-accent' : 'bg-line')} />
                  <span
                    className={cn(
                      'mt-1.5 block text-xs leading-tight group-hover:text-brand-700',
                      vista ? 'font-semibold text-brand-700' : f.numero === fase.numero ? 'font-medium text-ink' : 'hidden text-subtle sm:block',
                    )}
                  >
                    {f.numero}. {f.nome}
                  </span>
                </Link>
              </li>
            )
          })}
        </ol>
        <p className="mb-5 px-1 text-xs text-subtle">Clique numa fase para ver as etapas dela.</p>

        <Abas abas={abas} ativa={aba} />
      </div>

      {aba === 'proposta' && proposta && (
        <PropostaDoProcesso
          processo={processo}
          cliente={cliente}
          proposta={proposta}
          situacao={situacaoProposta}
          parcelas={parcelas.map((p) => p.parcela)}
          dia={dia}
          marcar={editar}
          editarTexto={pode(usuario.papel, 'comercial', 'editar')}
        />
      )}

      {aba === 'etapas' && <EtapasDaFase processo={processo} fase={faseVista} dia={dia} prazos={prazos} editar={editar} />}

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
            <p className="mb-3 text-sm text-muted">
              Para lançar um evento, marque a etapa na{' '}
              <Link href={`/processos/${id}?aba=etapas&fase=${fase.numero}`} className="link">
                fase {fase.nome}
              </Link>{' '}
              (ou em outra fase, clicando nela na barra acima).
            </p>
          )}
          <Lista>
            {eventos.itens.map((evento) => {
              const info = EVENTOS[evento.tipo]
              const seguinte = FASES.find((f) => f.numero === info.fase + 1)
              return (
              <Linha key={evento.id} className="group">
                <span className="w-24 shrink-0 tabular-nums text-muted">{formatarData(evento.data)}</span>
                <span className="min-w-0 flex-1">
                  <span className="block text-ink">{info.nome}</span>
                  {evento.observacao && <span className="block whitespace-pre-line text-sm text-muted">{evento.observacao}</span>}
                  {info.fecha && evento.data <= dia && (
                    <span className="block text-xs text-ok">{seguinte ? `Fechou a fase ${FASES[info.fase - 1].nome}; o processo passou para ${seguinte.nome}` : 'Encerrou o processo'}</span>
                  )}
                </span>
                <span className="hidden w-44 shrink-0 truncate text-xs text-subtle md:block">
                  Fase {info.fase} · {FASES[info.fase - 1].nome}
                </span>
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
                        {info.fecha && ' A fase não volta sozinha: se precisar, corrija em Editar.'}
                      </p>
                      <BotaoEnviar variante="perigo" className="w-full">
                        Apagar evento
                      </BotaoEnviar>
                    </form>
                  </details>
                )}
              </Linha>
              )
            })}
          </Lista>
          {eventos.total === 0 && <Vazio>Nenhum evento ainda.</Vazio>}
          <Paginacao {...eventos} href={(n) => `/processos/${id}?aba=linha-do-tempo${n > 1 ? `&pagina=${n}` : ''}`} />
        </>
      )}

      {aba === 'cobranca' && (
        <Secao
          titulo="Contrato"
          acao={
            editarFinanceiro && (
              <Link href={`/financeiro/contratos/${processo.id}`} className="link text-sm font-medium">
                Editar contrato
              </Link>
            )
          }
        >
          {parcelas.length > 0 ? (
            <div className="overflow-x-auto">
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
                          <Link href={`/financeiro/notas/nova?parcela=${parcela.id}`} className="link font-medium">
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
            </div>
          ) : (
            <Vazio>Nenhum contrato cadastrado para este processo.</Vazio>
          )}
        </Secao>
      )}
    </>
  )
}

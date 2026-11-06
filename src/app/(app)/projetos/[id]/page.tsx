import type { Metadata } from 'next'
import { LinkRapido } from '@/components/ui/link-rapido'
import { notFound } from 'next/navigation'
import { BotaoFixar } from '@/components/layout/fixados'
import { LinhaPrazo } from '@/components/prazos/linha-prazo'
import { descreverSituacao } from '@/components/prazos/situacao-prazo'
import { TrilhaDeFases } from '@/components/processos/trilha-de-fases'
import { Abas } from '@/components/ui/abas'
import { Badge, type Tom } from '@/components/ui/badge'
import { BotaoConfirmar } from '@/components/ui/botao-confirmar'
import { Card } from '@/components/ui/card'
import { Expansivel, Vazio } from '@/components/ui/expansivel'
import { classeBotao } from '@/components/ui/form'
import { Linha, Lista } from '@/components/ui/lista'
import { PageHeader } from '@/components/ui/page-header'
import { Paginacao } from '@/components/ui/paginacao'
import { Secao } from '@/components/ui/secao'
import { Situacao } from '@/components/ui/situacao'
import { Zona } from '@/components/ui/zona'
import { hoje } from '@/data/hoje'
import { obterProcesso } from '@/data/processos'
import { exigirArea } from '@/data/sessao'
import type { SituacaoParcela } from '@/domain/financeiro/parcelas'
import { estaAberto, proximoPrazo } from '@/domain/prazos'
import { EVENTOS, FASES, situacaoDaFase } from '@/domain/processos'
import { brl, formatarData } from '@/lib/formatar'
import { paginar } from '@/lib/paginar'
import { pode } from '@/lib/permissoes'
import { EtapasDaFase } from '../_components/etapas-da-fase'
import { PropostaDoProcesso } from '../_components/proposta-do-processo'
import { apagarEvento } from '../actions'

export const metadata: Metadata = { title: 'Projeto' }

const PARCELA: Record<SituacaoParcela, { rotulo: string; tom: Tom }> = {
  aguardando: { rotulo: 'Aguardando o evento', tom: 'neutral' },
  liberada: { rotulo: 'Pronta para faturar', tom: 'warn' },
  faturada: { rotulo: 'Faturada', tom: 'info' },
  recebida: { rotulo: 'Recebida', tom: 'ok' },
}

const ESTADO_NA_TRILHA = { concluida: 'feita', atual: 'atual', futura: 'futura' } as const

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
    { valor: 'etapas', rotulo: 'Etapas' },
    ...(proposta ? [{ valor: 'proposta', rotulo: 'Proposta' }] : []),
    { valor: 'prazos', rotulo: 'Prazos', contagem: abertos.length },
    { valor: 'linha-do-tempo', rotulo: 'Linha do tempo', contagem: eventos.total },
    ...(pode(usuario.papel, 'financeiro') ? [{ valor: 'cobranca', rotulo: 'Cobrança', contagem: parcelas.length }] : []),
  ].map((a) => ({ ...a, href: a.valor === padrao ? `/projetos/${id}` : `/projetos/${id}?aba=${a.valor}` }))
  const aba = abas.find((a) => a.valor === pedida)?.valor ?? padrao

  const ficha = [
    ['Cliente', cliente.nome],
    ['Endereço', processo.endereco],
    ['Processo SEI', processo.numeroSei || 'Sem nº SEI (ainda não aberto na SVMA)'],
    ['SIMPROC', processo.numeroSimproc],
    ['TCA', processo.numeroTca],
    ['Serviço', processo.servico === 'manejo' ? 'Manejo' : 'Licenciamento'],
    ['Responsável', processo.responsavel],
  ].filter(([, valor]) => valor)

  return (
    <>
      <div className="print:hidden">
        <PageHeader
          voltar={processo.faseAtual === 1 || recusada ? { href: '/comercial', rotulo: 'Voltar para Propostas' } : { href: '/projetos', rotulo: 'Voltar para Projetos' }}
          titulo={processo.empreendimento}
          resumo={
            <>
              {recusada && <p className="mb-3">Proposta recusada em {formatarData(situacaoProposta.recusadaEm!)}. Não aparece na lista de projetos; fica em Propostas.</p>}
              <dl className="mt-3.5 flex flex-wrap gap-x-12 gap-y-2">
                {ficha.map(([rotulo, valor]) => (
                  <div key={rotulo} className="min-w-0">
                    <dt className="text-2xs font-semibold text-subtle">{rotulo}</dt>
                    <dd className="text-base text-ink">{valor}</dd>
                  </div>
                ))}
              </dl>
            </>
          }
          acoes={
            <>
              <BotaoFixar href={`/projetos/${processo.id}`} rotulo={processo.empreendimento} />
              {editar && (
                <LinkRapido href={`/projetos/${processo.id}/editar`} className={classeBotao('secundario')}>
                  Editar
                </LinkRapido>
              )}
              <LinkRapido href={`/portal/${processo.id}`} target="_blank" className={classeBotao('secundario')}>
                Ver como o cliente vê
              </LinkRapido>
            </>
          }
        />

        <Zona
          tom="proximos"
          titulo={`Fase ${fase.numero} de ${FASES.length} — ${fase.nome}`}
          detalhe={!recusada && (proximo ? `Próximo prazo: ${proximo.regra.titulo} (${descreverSituacao(proximo, dia).rotulo.toLowerCase()}).` : 'Nenhum prazo em aberto.')}
          className="pb-5.5!"
        >
          <TrilhaDeFases
            fases={FASES.map((f) => ({
              numero: f.numero,
              nome: f.nome,
              estado: ESTADO_NA_TRILHA[situacaoDaFase(processo, f.numero, dia)],
              href: `/projetos/${id}?aba=etapas&fase=${f.numero}`,
              dica: `Ver as etapas: ${f.descricao}`,
              selecionada: aba === 'etapas' && f.numero === faseVista,
            }))}
          />
          <p className="mt-4 text-sm text-muted">Clique numa fase para ver as etapas dela.</p>
        </Zona>

        <Abas abas={abas} ativa={aba} className="w-fit max-w-full" />
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
          <Zona tom="proximos" titulo="Prazos em aberto">
            {abertos.length > 0 ? (
              <ul>
                {abertos.map((prazo) => (
                  <LinhaPrazo key={prazo.id} prazo={prazo} hoje={dia} />
                ))}
              </ul>
            ) : (
              <Vazio>Nenhum prazo em aberto.</Vazio>
            )}
          </Zona>
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
            <p className="mb-4 max-w-[84ch] text-base text-muted">
              Para lançar um evento, marque a etapa na{' '}
              <LinkRapido href={`/projetos/${id}?aba=etapas&fase=${fase.numero}`} className="link">
                fase {fase.nome}
              </LinkRapido>{' '}
              (ou em outra fase, clicando nela na barra acima).
            </p>
          )}
          {eventos.total > 0 ? (
            <Lista className="@container">
              {eventos.itens.map((evento) => {
                const info = EVENTOS[evento.tipo]
                const seguinte = FASES.find((f) => f.numero === info.fase + 1)
                return (
                  <Linha key={evento.id} className="@[52rem]:flex-nowrap">
                    <span className="w-30 shrink-0 text-base font-semibold text-ink">{formatarData(evento.data)}</span>
                    <div className="order-1 min-w-0 basis-full @[52rem]:order-none @[52rem]:flex-1 @[52rem]:basis-0">
                      <p className="text-lg font-semibold text-ink">{info.nome}</p>
                      <p className="text-sm text-muted">
                        Fase {info.fase} · {FASES[info.fase - 1].nome}
                      </p>
                      {evento.observacao && <p className="mt-1 whitespace-pre-line text-sm text-muted">{evento.observacao}</p>}
                      {info.fecha && evento.data <= dia && (
                        <p className="mt-1 text-sm font-medium text-ok">{seguinte ? `Fechou a fase ${FASES[info.fase - 1].nome}; o projeto passou para ${seguinte.nome}` : 'Encerrou o projeto'}</p>
                      )}
                    </div>
                    <div className="ml-auto flex flex-wrap items-center justify-end gap-2">
                      {evento.data > dia && <Situacao tom="warn">Planejado</Situacao>}
                      <Badge>{evento.origem === 'diario' ? 'Diário Oficial' : 'Equipe'}</Badge>
                    </div>
                    {editar && (
                      <form action={apagarEvento.bind(null, evento.id)} className="order-2 @[52rem]:order-none">
                        <BotaoConfirmar
                          variante="secundario"
                          titulo="Apagar este evento?"
                          oQue={`${info.nome} · ${formatarData(evento.data)}`}
                          consequencia={
                            <>
                              Os prazos gerados por ele somem, e os que ele cumpriu voltam a ficar em aberto.
                              {evento.origem === 'diario' && ' O ato volta para a caixa de entrada do Diário Oficial.'}
                              {info.fecha && ' A fase não volta sozinha: se precisar, corrija em Editar.'}
                            </>
                          }
                          sim="Sim, apagar o evento"
                        >
                          Apagar evento
                        </BotaoConfirmar>
                      </form>
                    )}
                  </Linha>
                )
              })}
            </Lista>
          ) : (
            <Vazio>Nenhum evento ainda.</Vazio>
          )}
          <Paginacao {...eventos} href={(n) => `/projetos/${id}?aba=linha-do-tempo${n > 1 ? `&pagina=${n}` : ''}`} />
        </>
      )}

      {aba === 'cobranca' && (
        <Card
          titulo="Contrato"
          flush={parcelas.length > 0}
          acao={
            editarFinanceiro && (
              <LinkRapido href={`/financeiro/contratos/${processo.id}`} className={classeBotao('secundario')}>
                Editar contrato
              </LinkRapido>
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
                      {liberadaEm && <span className="block text-xs">aconteceu em {formatarData(liberadaEm)}</span>}
                    </td>
                    <td>
                      <Situacao tom={PARCELA[situacao].tom} className="whitespace-nowrap">
                        {PARCELA[situacao].rotulo}
                      </Situacao>
                    </td>
                    <td className="text-muted">
                      {nota ? (
                        `NF ${nota.numero} · ${formatarData(nota.emissao)}`
                      ) : situacao === 'liberada' && editarFinanceiro ? (
                        <LinkRapido href={`/financeiro/notas/nova?parcela=${parcela.id}`} className={classeBotao('secundario')}>
                          Emitir nota
                        </LinkRapido>
                      ) : (
                        '—'
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <Vazio>Nenhum contrato cadastrado para este projeto.</Vazio>
          )}
        </Card>
      )}
    </>
  )
}

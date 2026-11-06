import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import type { ReactNode } from 'react'
import { AbasDoDia } from '@/components/layout/abas-do-dia'
import { SituacaoPrazo } from '@/components/prazos/situacao-prazo'
import { COR_DO_TEXTO, type Tom } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Vazio } from '@/components/ui/expansivel'
import { classeBotao } from '@/components/ui/form'
import { LinkRapido } from '@/components/ui/link-rapido'
import { PageHeader } from '@/components/ui/page-header'
import { Situacao } from '@/components/ui/situacao'
import { Item, Zona } from '@/components/ui/zona'
import { projecaoDeCaixa, listarNotas } from '@/data/financeiro'
import { hoje } from '@/data/hoje'
import { listarParcelasLiberadas, listarPrazos, listarPropostas, type PrazoComProcesso } from '@/data/processos'
import { listarPublicacoes } from '@/data/publicacoes'
import { exigirUsuario } from '@/data/sessao'
import { abaDaNota } from '@/domain/financeiro/ciclo'
import { resumoNotas } from '@/domain/financeiro/notas'
import { estaAberto } from '@/domain/prazos'
import { EVENTOS } from '@/domain/processos'
import { diaDaSemana, somarDias, type DataISO } from '@/lib/datas'
import { cn } from '@/lib/cn'
import { brl, contar, formatarData, formatarDataCurta, formatarDataNaLista, formatarDiaEData, juntar } from '@/lib/formatar'
import { inicioDoPapel, pode } from '@/lib/permissoes'
import { AcoesPublicacao } from './publicacoes/_components/acoes-publicacao'

export const metadata: Metadata = { title: 'Hoje' }

const HORARIO = new Intl.DateTimeFormat('pt-BR', { timeZone: 'America/Sao_Paulo', hour: '2-digit', minute: '2-digit' })

const DIAS_DA_SEMANA = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado']

const LINK_SOLTO = 'link inline-flex min-h-12 items-center text-sm'

/** Item que abre outra tela: ele todo é o link, e o botão diz para onde leva. */
function ItemQueAbre({ href, acao, perigo, lado, ...item }: { href: string; acao: string; perigo?: boolean; lado?: ReactNode; etiqueta: ReactNode; titulo: ReactNode; detalhe: ReactNode }) {
  return (
    <LinkRapido href={href} className="group block">
      <Item
        {...item}
        className="transition-colors group-hover:bg-brand-50"
        fim={
          <>
            {lado}
            <span className={perigo ? classeBotao('perigo', 'min-h-14 text-[1.25rem]') : classeBotao('secundario', 'group-hover:bg-brand-100')}>{acao}</span>
          </>
        }
      />
    </LinkRapido>
  )
}

function ItemPrazo({ prazo, dia }: { prazo: PrazoComProcesso; dia: DataISO }) {
  const vencido = prazo.vencimento < dia
  const proximo = prazo.vencimento > dia
  const contexto = `${prazo.processo.empreendimento} · ${prazo.processo.responsavel}`
  return (
    <ItemQueAbre
      href={`/projetos/${prazo.processo.id}?aba=etapas&fase=${EVENTOS[prazo.regra.cumpridoPor].fase}`}
      acao={proximo ? 'Abrir' : 'Abrir o prazo'}
      perigo={vencido}
      etiqueta={<SituacaoPrazo prazo={prazo} hoje={dia} />}
      titulo={prazo.regra.titulo}
      detalhe={vencido ? `${contexto} · ${formatarDiaEData(prazo.vencimento)}` : contexto}
      lado={proximo && <span className="text-sm font-semibold text-brand-700">{formatarDiaEData(prazo.vencimento)}</span>}
    />
  )
}

function Valor({ rotulo, valor, detalhe, tom = 'neutral', className }: { rotulo: string; valor: string; detalhe?: string; tom?: Tom; className?: string }) {
  return (
    <div className={cn('flex flex-wrap items-baseline justify-between gap-x-3 py-2.5', className)}>
      <dt className={cn('text-sm', COR_DO_TEXTO[tom])}>
        {rotulo}
        {detalhe && <span className="block text-2xs text-muted">{detalhe}</span>}
      </dt>
      <dd className={cn('ml-auto text-[1.25rem] font-semibold', COR_DO_TEXTO[tom])}>{valor}</dd>
    </div>
  )
}

const porVencimento = (a: PrazoComProcesso, b: PrazoComProcesso) => a.vencimento.localeCompare(b.vencimento)

export default async function Hoje() {
  const usuario = await exigirUsuario()
  if (!pode(usuario.papel, 'prazos')) redirect(inicioDoPapel(usuario.papel))
  const verFinanceiro = pode(usuario.papel, 'financeiro')
  const editar = pode(usuario.papel, 'prazos', 'editar')

  const [dia, prazos, publicacoes, { notas }, parcelas, caixa, propostas] = await Promise.all([
    hoje(),
    listarPrazos(),
    listarPublicacoes(),
    listarNotas(),
    listarParcelasLiberadas(),
    projecaoDeCaixa(),
    listarPropostas(),
  ])

  // Só as obrigações da Eco Direito; o que depende da SVMA fica na tela de prazos.
  const abertos = prazos.filter((p) => p.regra.tipo !== 'expectativa' && estaAberto(p, dia)).sort(porVencimento)
  const vencidos = abertos.filter((p) => p.vencimento < dia)
  const deHoje = abertos.filter((p) => p.vencimento === dia)
  const semana = abertos.filter((p) => p.vencimento > dia && p.vencimento <= somarDias(dia, 7))
  const novas = publicacoes.itens.filter((item) => item.ato.status === 'nova')
  const aFaturar = verFinanceiro ? parcelas : []
  // Quem não vê o Comercial recebe a lista de propostas vazia.
  const retornos = propostas.filter((item) => item.situacao.pedeRetorno)

  const todas = notas.map(({ nota }) => nota)
  const geral = resumoNotas(todas, dia)
  const ultimos30 = resumoNotas(
    todas.filter((nota) => nota.emissao > somarDias(dia, -30)),
    dia,
  )
  const atrasadas = verFinanceiro ? notas.filter(({ nota }) => abaDaNota(nota, dia) === 'atrasadas') : []
  const clientesAtrasados = [...new Set(atrasadas.map(({ cliente }) => cliente.nome))]
  const aVencer = geral.aReceber - geral.atrasado
  const notasEmDia = todas.filter((nota) => ['a-vencer', 'hoje'].includes(abaDaNota(nota, dia) ?? '')).length
  const ultimaSemana = caixa.semanas.at(-1)!

  const pendencias = [
    vencidos.length && contar(vencidos.length, 'prazo vencido', 'prazos vencidos'),
    deHoje.length && contar(deHoje.length, 'prazo vence hoje', 'prazos vencem hoje'),
    semana.length && `${contar(semana.length, 'prazo', 'prazos')} nos próximos 7 dias`,
    novas.length && contar(novas.length, 'publicação para revisar', 'publicações para revisar'),
    aFaturar.length && contar(aFaturar.length, 'parcela para faturar', 'parcelas para faturar'),
    retornos.length && contar(retornos.length, 'proposta sem resposta', 'propostas sem resposta'),
  ].filter((parte): parte is string => Boolean(parte))

  const itensAtrasados = vencidos.length + (atrasadas.length > 0 ? 1 : 0)
  const itensDeHoje = deHoje.length + novas.length + aFaturar.length + retornos.length
  const { edicao } = publicacoes

  return (
    <>
      <PageHeader
        titulo="Hoje"
        resumo={
          <span className="text-[1.375rem] font-medium text-brand-700">
            {DIAS_DA_SEMANA[diaDaSemana(dia)]}, {formatarData(dia)}
          </span>
        }
        acoes={<AbasDoDia ativa="fazer" className="mb-0!" />}
      />
      <p className="mb-8 max-w-[70ch] text-[1.25rem] text-muted">{pendencias.length ? `${juntar(pendencias)}.` : 'Nada pendente.'}</p>

      <div className="grid grid-cols-1 gap-x-8 xl:grid-cols-[minmax(0,1fr)_23.75rem] xl:items-start">
        <div>
          {itensAtrasados + itensDeHoje + semana.length === 0 && <Vazio>Nenhum prazo, publicação ou cobrança pede atenção agora.</Vazio>}

          {itensAtrasados > 0 && (
            <Zona tom="atraso" titulo="Atrasado" detalhe={contar(itensAtrasados, 'item', 'itens')}>
              {vencidos.map((prazo) => (
                <ItemPrazo key={prazo.id} prazo={prazo} dia={dia} />
              ))}
              {atrasadas.length > 0 && (
                <ItemQueAbre
                  href="/financeiro?aba=atrasadas"
                  acao="Ver notas"
                  etiqueta={<Situacao tom="danger">{contar(atrasadas.length, 'nota atrasada', 'notas atrasadas')}</Situacao>}
                  titulo="Cobrar clientes"
                  detalhe={juntar(clientesAtrasados.length > 3 ? [...clientesAtrasados.slice(0, 3), `mais ${clientesAtrasados.length - 3}`] : clientesAtrasados)}
                  lado={<span className="text-[1.25rem] font-semibold text-danger">{brl(geral.atrasado)}</span>}
                />
              )}
            </Zona>
          )}

          {itensDeHoje > 0 && (
            <Zona tom="hoje" titulo="Hoje" detalhe={contar(itensDeHoje, 'item', 'itens')}>
              {deHoje.map((prazo) => (
                <ItemPrazo key={prazo.id} prazo={prazo} dia={dia} />
              ))}
              {novas.map(({ ato, cliente, processo, evento, prazosSugeridos }) => (
                <Item
                  key={ato.id}
                  etiqueta={<Situacao tom="info">Nova no Diário</Situacao>}
                  titulo={
                    <LinkRapido href="/publicacoes" className="hover:text-brand-700">
                      {ato.serie}
                    </LinkRapido>
                  }
                  detalhe={processo ? processo.empreendimento : `${cliente.nome} · projeto ainda não cadastrado`}
                  fim={
                    editar ? (
                      <AcoesPublicacao
                        id={ato.id}
                        temProcesso={Boolean(processo)}
                        marcaEtapa={Boolean(evento)}
                        oQue={`${ato.serie} · ${cliente.nome} · ${formatarDataNaLista(ato.data, dia)}`}
                        prazos={prazosSugeridos.map((prazo) => prazo.titulo)}
                      />
                    ) : (
                      'A revisar'
                    )
                  }
                />
              ))}
              {aFaturar.map(({ parcela, processo, cliente }) => (
                <ItemQueAbre
                  key={parcela.id}
                  href={`/financeiro/notas/nova?parcela=${parcela.id}`}
                  acao="Registrar nota"
                  etiqueta={<Situacao tom="ok">Pronta para faturar</Situacao>}
                  titulo={processo.empreendimento}
                  detalhe={`${parcela.descricao} · ${cliente.nome}`}
                  lado={<span className="text-[1.25rem] font-semibold text-ink">{brl(parcela.valor)}</span>}
                />
              ))}
              {retornos.map(({ processo, cliente, situacao }) => (
                <ItemQueAbre
                  key={processo.id}
                  href={`/projetos/${processo.id}?aba=proposta`}
                  acao="Abrir a proposta"
                  etiqueta={
                    <Situacao tom="brand" className="border-warn! text-warn!">
                      {`Sem resposta há ${contar(situacao.diasSemResposta ?? 0, 'dia', 'dias')}`}
                    </Situacao>
                  }
                  titulo="Pedir retorno da proposta"
                  detalhe={`${processo.empreendimento} · ${cliente.nome}`}
                />
              ))}
            </Zona>
          )}

          {semana.length > 0 && (
            <Zona
              tom="proximos"
              titulo="Próximos 7 dias"
              acao={
                <LinkRapido href="/prazos" className={LINK_SOLTO}>
                  Ver todos os prazos
                </LinkRapido>
              }
            >
              {semana.map((prazo) => (
                <ItemPrazo key={prazo.id} prazo={prazo} dia={dia} />
              ))}
            </Zona>
          )}
        </div>

        <aside className="grid grid-cols-1 items-start gap-x-7 md:grid-cols-2 xl:grid-cols-1">
          {verFinanceiro && (
            <Card
              className="mb-7"
              titulo="Dinheiro"
              acao={
                <LinkRapido href="/financeiro" className={LINK_SOLTO}>
                  Abrir o Financeiro
                </LinkRapido>
              }
            >
              <div className="rounded-lg bg-surface px-5 py-4.5">
                <p className="text-xs font-medium text-muted">Saldo em conta hoje</p>
                <p className="mt-0.5 text-2xl font-semibold">{brl(caixa.saldoHoje)}</p>
                <p className="mt-1 text-xs text-muted">Mais {brl(caixa.aplicado)} aplicados</p>
              </div>

              <dl className="mt-4">
                <Valor rotulo="A receber" valor={brl(geral.aReceber)} className="border-b border-line" />
              </dl>
              {geral.aReceber > 0 && (
                <div
                  role="img"
                  aria-label={`Do valor a receber, ${brl(aVencer)} estão a vencer e ${brl(geral.atrasado)} estão atrasados`}
                  className="mb-1 mt-3.5 flex h-3.5 gap-0.75 overflow-hidden rounded-full"
                >
                  <span className="bg-brand-500" style={{ flexGrow: aVencer }} />
                  <span className="bg-danger" style={{ flexGrow: geral.atrasado }} />
                </div>
              )}
              <dl>
                <Valor rotulo="A vencer" detalhe={`${contar(notasEmDia, 'nota', 'notas')}, em dia`} valor={brl(aVencer)} tom="ok" />
                <Valor rotulo="Atrasado" detalhe={contar(geral.quantidadeAtrasadas, 'nota', 'notas')} valor={brl(geral.atrasado)} tom={geral.atrasado > 0 ? 'danger' : 'neutral'} />
              </dl>
              {atrasadas.length > 0 && (
                <LinkRapido href="/financeiro?aba=atrasadas" className={classeBotao('secundario', 'mt-3 w-full')}>
                  Ver notas atrasadas
                </LinkRapido>
              )}

              <div className="mt-4 border-t border-line pt-2 text-sm">
                <dl>
                  <Valor rotulo="Faturado em 30 dias" detalhe={contar(ultimos30.quantidade, 'nota', 'notas')} valor={brl(ultimos30.faturado)} />
                </dl>
                <p>
                  Saldo previsto para {formatarDataCurta(ultimaSemana.fim)}: <b className="font-semibold">{brl(ultimaSemana.saldoFinal)}</b>, se nada mudar.
                </p>
                <LinkRapido href="/financeiro/fluxo" className={LINK_SOLTO}>
                  Ver o fluxo de caixa
                </LinkRapido>
              </div>
            </Card>
          )}

          <Zona tom="diario" titulo="Diário Oficial" className="pb-6!">
            <p className="mb-4 text-sm">
              {edicao.erro ? (
                <span className="font-medium text-warn">{edicao.erro}</span>
              ) : (
                <>
                  Edição de {formatarDiaEData(edicao.data)}
                  {edicao.processadaEm && `, lida às ${HORARIO.format(new Date(edicao.processadaEm))}`}.{' '}
                  {novas.length ? `${contar(novas.length, 'ato', 'atos')} da Eco Direito para revisar.` : 'Nada novo para a Eco Direito.'}
                </>
              )}
            </p>
            <LinkRapido href="/publicacoes" className={classeBotao('diario-claro', 'w-full')}>
              Abrir o Diário Oficial
            </LinkRapido>
          </Zona>
        </aside>
      </div>
    </>
  )
}

import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import type { ReactNode } from 'react'
import { SituacaoPrazo } from '@/components/prazos/situacao-prazo'
import { Vazio } from '@/components/ui/expansivel'
import { Linha, Lista } from '@/components/ui/lista'
import { PageHeader } from '@/components/ui/page-header'
import { Secao } from '@/components/ui/secao'
import { Situacao } from '@/components/ui/situacao'
import { projecaoDeCaixa, listarNotas } from '@/data/financeiro'
import { hoje } from '@/data/hoje'
import { listarParcelasLiberadas, listarPrazos, listarPropostas, type PrazoComProcesso } from '@/data/processos'
import { listarPublicacoes } from '@/data/publicacoes'
import { exigirUsuario } from '@/data/sessao'
import { abaDaNota } from '@/domain/financeiro/ciclo'
import { resumoNotas } from '@/domain/financeiro/notas'
import { estaAberto } from '@/domain/prazos'
import { somarDias, type DataISO } from '@/lib/datas'
import { cn } from '@/lib/cn'
import { brl, contar, formatarDataLonga, formatarDiaEData, juntar } from '@/lib/formatar'
import { inicioDoPapel, pode } from '@/lib/permissoes'

export const metadata: Metadata = { title: 'Hoje' }

const HORARIO = new Intl.DateTimeFormat('pt-BR', { timeZone: 'America/Sao_Paulo', hour: '2-digit', minute: '2-digit' })

/** Uma linha da lista do dia: situação à esquerda, o que é no meio, data ou valor à direita. */
function Item({ href, situacao, titulo, contexto, direita }: { href: string; situacao: ReactNode; titulo: ReactNode; contexto: ReactNode; direita: ReactNode }) {
  return (
    <Linha href={href} className="flex-wrap gap-x-4 gap-y-0.5 sm:flex-nowrap">
      <span className="w-full shrink-0 sm:w-44">{situacao}</span>
      <span className="min-w-0 flex-1">
        <span className="block truncate font-medium text-ink">{titulo}</span>
        <span className="block truncate text-xs text-muted">{contexto}</span>
      </span>
      <span className="shrink-0 text-right text-sm tabular-nums text-muted">{direita}</span>
    </Linha>
  )
}

function ItemPrazo({ prazo, dia }: { prazo: PrazoComProcesso; dia: DataISO }) {
  return (
    <Item
      href={`/processos/${prazo.processo.id}`}
      situacao={<SituacaoPrazo prazo={prazo} hoje={dia} />}
      titulo={prazo.regra.titulo}
      contexto={`${prazo.processo.empreendimento} · ${prazo.processo.responsavel}`}
      direita={formatarDiaEData(prazo.vencimento)}
    />
  )
}

function Valor({ rotulo, valor, detalhe, perigo }: { rotulo: string; valor: string; detalhe?: string; perigo?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-3 py-2.5">
      <dt className="text-muted">
        {rotulo}
        {detalhe && <span className="block text-xs text-subtle">{detalhe}</span>}
      </dt>
      <dd className={cn('font-semibold tabular-nums', perigo ? 'text-danger' : 'text-ink')}>{valor}</dd>
    </div>
  )
}

const porVencimento = (a: PrazoComProcesso, b: PrazoComProcesso) => a.vencimento.localeCompare(b.vencimento)

export default async function Hoje() {
  const usuario = await exigirUsuario()
  if (!pode(usuario.papel, 'prazos')) redirect(inicioDoPapel(usuario.papel))
  const verFinanceiro = pode(usuario.papel, 'financeiro')

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

  const pendencias = [
    vencidos.length && contar(vencidos.length, 'prazo vencido', 'prazos vencidos'),
    deHoje.length && contar(deHoje.length, 'prazo vence hoje', 'prazos vencem hoje'),
    semana.length && `${contar(semana.length, 'prazo', 'prazos')} nos próximos 7 dias`,
    novas.length && contar(novas.length, 'publicação para revisar', 'publicações para revisar'),
    aFaturar.length && contar(aFaturar.length, 'parcela para faturar', 'parcelas para faturar'),
    retornos.length && contar(retornos.length, 'proposta sem resposta', 'propostas sem resposta'),
  ].filter((parte): parte is string => Boolean(parte))
  const data = formatarDataLonga(dia)

  const temAtrasado = vencidos.length > 0 || atrasadas.length > 0
  const temHoje = deHoje.length + novas.length + aFaturar.length + retornos.length > 0
  const { edicao } = publicacoes

  return (
    <>
      <PageHeader
        titulo="Hoje"
        resumo={`${data.charAt(0).toUpperCase()}${data.slice(1)}. ${pendencias.length ? `${juntar(pendencias)}.` : 'Nada pendente.'}`}
      />

      <div className="grid grid-cols-1 gap-x-10 gap-y-8 lg:grid-cols-[minmax(0,1fr)_18rem]">
        <div>
          {!temAtrasado && !temHoje && !semana.length && <Vazio>Nenhum prazo, publicação ou cobrança pede atenção agora.</Vazio>}

          {temAtrasado && (
            <Secao titulo="Atrasado">
              <Lista>
                {vencidos.map((prazo) => (
                  <ItemPrazo key={prazo.id} prazo={prazo} dia={dia} />
                ))}
                {atrasadas.length > 0 && (
                  <Item
                    href="/financeiro?aba=atrasadas"
                    situacao={<Situacao tom="danger">{contar(atrasadas.length, 'nota atrasada', 'notas atrasadas')}</Situacao>}
                    titulo="Cobrar clientes"
                    contexto={juntar(clientesAtrasados.length > 3 ? [...clientesAtrasados.slice(0, 3), `mais ${clientesAtrasados.length - 3}`] : clientesAtrasados)}
                    direita={<span className="font-semibold text-danger">{brl(geral.atrasado)}</span>}
                  />
                )}
              </Lista>
            </Secao>
          )}

          {temHoje && (
            <Secao titulo="Hoje">
              <Lista>
                {deHoje.map((prazo) => (
                  <ItemPrazo key={prazo.id} prazo={prazo} dia={dia} />
                ))}
                {novas.map(({ ato, cliente, processo }) => (
                  <Item
                    key={ato.id}
                    href="/publicacoes"
                    situacao={<Situacao tom="info">Nova no Diário</Situacao>}
                    titulo={ato.serie}
                    contexto={processo ? processo.empreendimento : `${cliente.nome} · processo ainda não cadastrado`}
                    direita="Revisar"
                  />
                ))}
                {aFaturar.map(({ parcela, processo, cliente }) => (
                  <Item
                    key={parcela.id}
                    href={`/financeiro/notas/nova?parcela=${parcela.id}`}
                    situacao={<Situacao tom="brand">Pronta para faturar</Situacao>}
                    titulo={processo.empreendimento}
                    contexto={`${parcela.descricao} · ${cliente.nome}`}
                    direita={<span className="font-semibold text-ink">{brl(parcela.valor)}</span>}
                  />
                ))}
                {retornos.map(({ processo, cliente, situacao }) => (
                  <Item
                    key={processo.id}
                    href={`/processos/${processo.id}?aba=proposta`}
                    situacao={<Situacao tom="warn">{`Sem resposta há ${contar(situacao.diasSemResposta ?? 0, 'dia', 'dias')}`}</Situacao>}
                    titulo="Pedir retorno da proposta"
                    contexto={`${processo.empreendimento} · ${cliente.nome}`}
                    direita="Proposta"
                  />
                ))}
              </Lista>
            </Secao>
          )}

          {semana.length > 0 && (
            <Secao
              titulo="Próximos 7 dias"
              acao={
                <Link href="/prazos" className="link text-sm">
                  Todos os prazos
                </Link>
              }
            >
              <Lista>
                {semana.map((prazo) => (
                  <ItemPrazo key={prazo.id} prazo={prazo} dia={dia} />
                ))}
              </Lista>
            </Secao>
          )}
        </div>

        <aside className="space-y-8">
          {verFinanceiro && (
            <Secao
              titulo="Dinheiro"
              acao={
                <Link href="/financeiro" className="link text-sm">
                  Financeiro
                </Link>
              }
            >
              <dl className="divide-y divide-line rounded-lg border border-line bg-surface px-4">
                <Valor rotulo="Saldo em conta" valor={brl(caixa.saldoHoje)} detalhe={`mais ${brl(caixa.aplicado)} aplicados`} />
                <Valor rotulo="A receber" valor={brl(geral.aReceber)} />
                <Valor rotulo="Atrasado" valor={brl(geral.atrasado)} perigo={geral.atrasado > 0} />
                <Valor rotulo="Faturado em 30 dias" valor={brl(ultimos30.faturado)} detalhe={contar(ultimos30.quantidade, 'nota', 'notas')} />
              </dl>
            </Secao>
          )}

          <Secao
            titulo="Diário Oficial"
            acao={
              <Link href="/publicacoes" className="link text-sm">
                Abrir
              </Link>
            }
          >
            <p className="rounded-lg border border-line bg-surface p-4 text-muted">
              {edicao.erro ? (
                <span className="text-warn">{edicao.erro}</span>
              ) : (
                <>
                  Edição de {formatarDiaEData(edicao.data)}
                  {edicao.processadaEm && `, lida às ${HORARIO.format(new Date(edicao.processadaEm))}`}.{' '}
                  {novas.length ? `${contar(novas.length, 'ato', 'atos')} da Eco Direito para revisar.` : 'Nada novo para a Eco Direito.'}
                </>
              )}
            </p>
          </Secao>
        </aside>
      </div>
    </>
  )
}

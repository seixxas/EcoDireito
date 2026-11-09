import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import { LinkRapido } from '@/components/ui/link-rapido'
import { notFound } from 'next/navigation'
import { SituacaoDaNota } from '@/components/financeiro/situacao-nota'
import { Card } from '@/components/ui/card'
import { classeBotao } from '@/components/ui/form'
import { Linha, Lista } from '@/components/ui/lista'
import { PageHeader } from '@/components/ui/page-header'
import { ItemResumo, Resumo } from '@/components/ui/resumo'
import { Secao } from '@/components/ui/secao'
import { lucratividadeDoProjeto } from '@/data/financeiro'
import { exigirArea } from '@/data/sessao'
import { CUSTO_HORA_EQUIPE } from '@/domain/financeiro/lucratividade'
import { situacaoNota } from '@/domain/financeiro/notas'
import { nomeDaConta } from '@/domain/financeiro/plano-de-contas'
import { cn } from '@/lib/cn'
import { brl, contar, formatarData, formatarPercentual } from '@/lib/formatar'
import { AvisoDeSimulacao, MARGENS, Margem } from '../_components/margem'
import { BARRA_DA_COPA, LINHA_DA_COPA } from '../../_components/identidade'

export const metadata: Metadata = { title: 'Lucratividade do projeto' }

/** Uma cor por conta de custo; a equipe vai listrada, porque é estimada. */
const CORES = ['bg-accent', 'bg-danger/70', 'bg-info/70', 'bg-brand-500']
const LISTRADO = 'bg-[repeating-linear-gradient(135deg,var(--color-accent)_0_3px,transparent_3px_7px)] ring-1 ring-inset ring-accent'

/** No celular, cada conta vira um cartão, em vez de a tabela rolar para o lado. */
const TABELA_EMPILHADA =
  'tabela min-w-0 max-sm:block max-sm:[&_tbody]:block max-sm:[&_thead]:hidden max-sm:[&_tr]:mb-1.5 max-sm:[&_tr]:flex max-sm:[&_tr]:flex-wrap max-sm:[&_tr]:items-center max-sm:[&_tr]:rounded-xl max-sm:[&_tr]:bg-surface max-sm:[&_tr]:py-1.5 max-sm:[&_td]:py-1 max-sm:[&_td.num]:flex max-sm:[&_td.num]:w-full max-sm:[&_td.num]:items-baseline max-sm:[&_td.num]:justify-between max-sm:[&_td:first-child]:w-full max-sm:[&_td:last-child]:ml-auto max-sm:[&_td:empty]:hidden'

/** Título da coluna, escrito dentro do cartão no celular. */
function NoCartao({ children }: { children: ReactNode }) {
  return <span className="text-xs font-semibold text-subtle sm:hidden">{children}</span>
}

export default async function PaginaLucratividade({ params }: { params: Promise<{ processoId: string }> }) {
  const { processoId } = await params
  const [, projeto] = await Promise.all([exigirArea('financeiro'), lucratividadeDoProjeto(processoId)])
  if (!projeto) notFound()
  const { hoje: dia, processo, cliente, notas, faturado, contratado, recebido, custosPorConta, custosDiretos, horas, custoEquipe, custoTotal, margem, margemPct, situacao } =
    projeto
  const lancamentos = (conta?: string) => `/financeiro/lancamentos?mes=todos&processo=${processo.id}${conta ? `&conta=${conta}` : ''}`
  const partes = [
    ...custosPorConta.map((c, i) => ({ chave: c.contaId, nome: nomeDaConta(c.contaId), valor: c.valor, cor: CORES[i % CORES.length], href: lancamentos(c.contaId) })),
    { chave: 'equipe', nome: `Equipe (estimado: ${contar(horas, 'hora', 'horas')} × ${brl(CUSTO_HORA_EQUIPE)})`, valor: custoEquipe, cor: LISTRADO, href: undefined },
  ]
  // A maior das duas barras ocupa a largura toda; a outra é proporcional.
  const escala = Math.max(faturado, custoTotal) || 1
  const doFaturado = (valor: number) => (faturado ? formatarPercentual(valor / faturado) : '—')

  return (
    <>
      <PageHeader
        voltar={{ href: '/financeiro/lucratividade', rotulo: 'Lucratividade por projeto' }}
        titulo={processo.empreendimento}
        resumo={`${cliente.nome} · ${processo.servico === 'manejo' ? 'manejo' : 'licenciamento'} · contrato de ${brl(contratado)}`}
        acoes={
          <>
            <LinkRapido href={lancamentos()} className={classeBotao('secundario')}>
              Lançamentos do projeto
            </LinkRapido>
            <LinkRapido href={`/projetos/${processo.id}`} className={classeBotao('secundario')}>
              Ver projeto
            </LinkRapido>
          </>
        }
      />
      <AvisoDeSimulacao className="mb-4" />

      <Resumo className={LINHA_DA_COPA}>
        <ItemResumo rotulo="Faturado" valor={brl(faturado)} detalhe={`${brl(recebido)} recebido`} />
        <ItemResumo rotulo="Custos diretos" valor={brl(custosDiretos)} detalhe={`${doFaturado(custosDiretos)} do faturado`} />
        <ItemResumo rotulo="Equipe (estimado)" valor={brl(custoEquipe)} detalhe={`${contar(horas, 'hora', 'horas')} × ${brl(CUSTO_HORA_EQUIPE)}`} />
        <ItemResumo
          rotulo="Margem"
          valor={margem === undefined ? '—' : brl(margem)}
          detalhe={margemPct === undefined ? 'sem faturamento ainda' : `${formatarPercentual(margemPct)} · ${MARGENS[situacao!].rotulo.toLowerCase()}`}
          tom={situacao ? MARGENS[situacao].tom : 'neutral'}
        />
      </Resumo>

      <Card titulo="Receita × custo" acao={<Margem margemPct={margemPct} situacao={situacao} />} className="mt-5">
        <div className="space-y-3">
          <div className="grid items-center gap-x-3 gap-y-1 sm:grid-cols-[6rem_1fr_11rem]">
            <span>Receita</span>
            <div className="h-8 overflow-hidden rounded-md bg-surface">
              <div className={cn('h-full rounded-md', BARRA_DA_COPA)} style={{ width: `${(faturado / escala) * 100}%` }} title={`Faturado: ${brl(faturado)}`} />
            </div>
            <span className="text-right text-sm font-semibold">{brl(faturado)}</span>
          </div>
          <div className="grid items-center gap-x-3 gap-y-1 sm:grid-cols-[6rem_1fr_11rem]">
            <span>Custo</span>
            <div className="flex h-8 overflow-hidden rounded-md bg-surface">
              {partes.map((p) => (
                <div key={p.chave} className={cn('h-full', p.cor)} style={{ width: `${(p.valor / escala) * 100}%` }} title={`${p.nome}: ${brl(p.valor)}`} />
              ))}
            </div>
            <span className="text-right text-sm font-semibold">{brl(custoTotal)}</span>
          </div>
        </div>
      </Card>

      <Secao titulo="Custos por conta">
        <Card flush>
          <table className={TABELA_EMPILHADA}>
            <thead>
              <tr>
                <th>Conta</th>
                <th className="num">Valor</th>
                <th className="num">Do faturado</th>
                <th className="num">Ação</th>
              </tr>
            </thead>
            <tbody>
              {partes.map((p) => (
                <tr key={p.chave}>
                  <td>
                    <span className={cn('mr-2 inline-block size-4 rounded-full align-[-0.125em]', p.cor)} />
                    {p.nome}
                  </td>
                  <td className="num">
                    <NoCartao>Valor</NoCartao>
                    {brl(p.valor)}
                  </td>
                  <td className="num text-base font-normal text-muted">
                    <NoCartao>Do faturado</NoCartao>
                    {doFaturado(p.valor)}
                  </td>
                  <td className="text-right">
                    {p.href && (
                      <LinkRapido href={p.href} className={classeBotao('secundario')}>
                        Ver lançamentos
                      </LinkRapido>
                    )}
                  </td>
                </tr>
              ))}
              <tr className="font-semibold">
                <td>Custo total</td>
                <td className="num">
                  <NoCartao>Valor</NoCartao>
                  {brl(custoTotal)}
                </td>
                <td className="num text-base font-normal">
                  <NoCartao>Do faturado</NoCartao>
                  {doFaturado(custoTotal)}
                </td>
                <td />
              </tr>
            </tbody>
          </table>
        </Card>
      </Secao>

      <Secao titulo={`Notas do projeto · ${brl(faturado)}`}>
        {notas.length ? (
          <Lista>
            {notas.map((nota) => (
              <Linha key={nota.id} href={`/financeiro/notas/${nota.id}`}>
                <span className="w-24 font-semibold">NF {nota.numero}</span>
                <span className="w-28 text-muted">{formatarData(nota.emissao)}</span>
                {/* No celular só cabem número, data e valor; o serviço está na nota. */}
                <span className={cn('hidden min-w-0 flex-1 truncate sm:block', nota.cancelada && 'text-subtle line-through')}>{nota.descricao}</span>
                <span className="flex-1 sm:hidden" />
                <span className="hidden sm:inline">
                  <SituacaoDaNota situacao={situacaoNota(nota, dia)} />
                </span>
                <span className="text-sm font-semibold">{brl(nota.valor)}</span>
              </Linha>
            ))}
          </Lista>
        ) : (
          <p className="text-muted">Nenhuma nota emitida ainda.</p>
        )}
      </Secao>
    </>
  )
}

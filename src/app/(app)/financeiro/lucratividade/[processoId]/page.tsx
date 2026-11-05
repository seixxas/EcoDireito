import { ArrowLeft } from 'lucide-react'
import type { Metadata } from 'next'
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
import { brl, contar, formatarDataCurta, formatarPercentual } from '@/lib/formatar'
import { AvisoDeSimulacao, MARGENS, Margem } from '../_components/margem'

export const metadata: Metadata = { title: 'Lucratividade do projeto' }

/** Uma cor por conta de custo; a equipe vai listrada, porque é estimada. */
const CORES = ['bg-accent', 'bg-danger/70', 'bg-info/70', 'bg-brand-500']
const LISTRADO = 'bg-[repeating-linear-gradient(135deg,var(--color-accent)_0_3px,transparent_3px_7px)] ring-1 ring-inset ring-accent'

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
      <LinkRapido href="/financeiro/lucratividade" className="mb-3 inline-flex items-center gap-1 text-sm text-muted hover:text-ink">
        <ArrowLeft className="size-4" /> Lucratividade por projeto
      </LinkRapido>
      <PageHeader
        titulo={processo.empreendimento}
        resumo={`${cliente.nome} · ${processo.servico === 'manejo' ? 'manejo' : 'licenciamento'} · contrato de ${brl(contratado)}`}
        acoes={
          <>
            <LinkRapido href={lancamentos()} className={classeBotao('secundario')}>
              Lançamentos do processo
            </LinkRapido>
            <LinkRapido href={`/processos/${processo.id}`} className={classeBotao('secundario')}>
              Ver processo
            </LinkRapido>
          </>
        }
      />
      <AvisoDeSimulacao className="mb-4" />

      <Resumo className="mb-8">
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

      <Secao titulo="Receita × custo" acao={<Margem margemPct={margemPct} situacao={situacao} />}>
        <div className="space-y-3">
          <div className="grid items-center gap-x-3 gap-y-1 sm:grid-cols-[7rem_1fr_8rem]">
            <span className="text-sm text-muted">Receita</span>
            <div className="h-6 overflow-hidden rounded bg-rail">
              <div className="h-full rounded bg-brand-300" style={{ width: `${(faturado / escala) * 100}%` }} title={`Faturado: ${brl(faturado)}`} />
            </div>
            <span className="text-right font-medium tabular-nums">{brl(faturado)}</span>
          </div>
          <div className="grid items-center gap-x-3 gap-y-1 sm:grid-cols-[7rem_1fr_8rem]">
            <span className="text-sm text-muted">Custo</span>
            <div className="flex h-6 overflow-hidden rounded bg-rail">
              {partes.map((p) => (
                <div key={p.chave} className={cn('h-full', p.cor)} style={{ width: `${(p.valor / escala) * 100}%` }} title={`${p.nome}: ${brl(p.valor)}`} />
              ))}
            </div>
            <span className="text-right font-medium tabular-nums">{brl(custoTotal)}</span>
          </div>
        </div>
      </Secao>

      <Secao titulo="Custos por conta">
        <Card flush>
          <table className="tabela">
            <thead>
              <tr>
                <th>Conta</th>
                <th className="num">Valor</th>
                <th className="num hidden sm:table-cell">Do faturado</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {partes.map((p) => (
                <tr key={p.chave}>
                  <td>
                    <span className={cn('mr-2 inline-block size-2.5 rounded-full align-middle', p.cor)} />
                    {p.nome}
                  </td>
                  <td className="num">{brl(p.valor)}</td>
                  <td className="num hidden text-muted sm:table-cell">{doFaturado(p.valor)}</td>
                  <td className="text-right">
                    {p.href && (
                      <LinkRapido href={p.href} className="link whitespace-nowrap text-sm">
                        lançamentos
                      </LinkRapido>
                    )}
                  </td>
                </tr>
              ))}
              <tr className="font-semibold">
                <td>Custo total</td>
                <td className="num">{brl(custoTotal)}</td>
                <td className="num hidden sm:table-cell">{doFaturado(custoTotal)}</td>
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
                <span className="w-20 tabular-nums">NF {nota.numero}</span>
                <span className="w-16 text-muted">{formatarDataCurta(nota.emissao)}</span>
                {/* No celular só cabem número, data e valor; o serviço está na nota. */}
                <span className={cn('hidden min-w-0 flex-1 truncate sm:block', nota.cancelada && 'text-subtle line-through')}>{nota.descricao}</span>
                <span className="flex-1 sm:hidden" />
                <span className="hidden sm:inline">
                  <SituacaoDaNota situacao={situacaoNota(nota, dia)} />
                </span>
                <span className="font-medium tabular-nums">{brl(nota.valor)}</span>
              </Linha>
            ))}
          </Lista>
        ) : (
          <p className="text-sm text-muted">Nenhuma nota emitida ainda.</p>
        )}
      </Secao>
    </>
  )
}

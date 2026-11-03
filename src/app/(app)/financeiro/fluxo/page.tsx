import { ArrowLeft, ChevronLeft, ChevronRight, TriangleAlert, type LucideIcon } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { GraficoFluxo } from '@/components/charts/grafico-fluxo'
import { Abas } from '@/components/ui/abas'
import { Card } from '@/components/ui/card'
import { Expansivel } from '@/components/ui/expansivel'
import { Linha, Lista } from '@/components/ui/lista'
import { PageHeader } from '@/components/ui/page-header'
import { ItemResumo, Resumo } from '@/components/ui/resumo'
import { projecaoDeCaixa } from '@/data/financeiro'
import { diasDaSemana, type SemanaFluxo } from '@/domain/financeiro/fluxo'
import { cn } from '@/lib/cn'
import { somar } from '@/lib/dinheiro'
import { brl, contar, formatarData, formatarDataCurta, formatarDataLonga, formatarDiaEData, formatarMes } from '@/lib/formatar'
import { AbrirLinha } from '../_components/abrir-linha'

export const metadata: Metadata = { title: 'Fluxo de caixa' }

const linkDaSemana = (semana: SemanaFluxo) => `/financeiro/fluxo?semana=${semana.inicio}`

export default async function PaginaFluxo({ searchParams }: { searchParams: Promise<{ aba?: string; semana?: string }> }) {
  const [filtros, { hoje: dia, saldoHoje, aplicado, semanas, mensal, atrasado }] = await Promise.all([searchParams, projecaoDeCaixa(8)])
  const aba = filtros.aba === 'realizado' ? 'realizado' : 'projecao'
  const zoom = semanas.findIndex((s) => s.inicio === filtros.semana)
  const entradas = somar(semanas.map((s) => s.entradas))
  const saidas = somar(semanas.map((s) => s.saidas))
  const ultima = semanas.at(-1)!
  const menor = semanas.reduce((a, b) => (b.saldoFinal < a.saldoFinal ? b : a))

  return (
    <>
      <PageHeader
        titulo="Fluxo de caixa"
        resumo={`${brl(saldoHoje)} na conta hoje; ${brl(ultima.saldoFinal)} em ${formatarDataCurta(ultima.fim)} se nada mudar.`}
      />

      <Resumo className="mb-6">
        <ItemResumo rotulo="Saldo hoje" valor={brl(saldoHoje)} detalhe={`mais ${brl(aplicado)} aplicados`} />
        <ItemResumo rotulo="Entradas previstas" valor={brl(entradas)} detalhe="próximas 8 semanas" tom="ok" />
        <ItemResumo rotulo="Saídas previstas" valor={brl(-saidas)} detalhe="próximas 8 semanas" />
        <ItemResumo rotulo={`Saldo em ${formatarDataCurta(ultima.fim)}`} valor={brl(ultima.saldoFinal)} detalhe="se nada mudar" tom={ultima.saldoFinal < 0 ? 'danger' : 'neutral'} />
      </Resumo>

      {menor.saldoFinal < saldoHoje / 2 && (
        <p className="mb-6 flex items-start gap-2.5 rounded-lg bg-warn-soft px-4 py-3 text-sm text-warn">
          <TriangleAlert className="mt-0.5 size-4 shrink-0" />
          <span>
            O saldo chega a {brl(menor.saldoFinal)} na semana de {formatarDataCurta(menor.inicio)}. Dá para antecipar a cobrança das notas atrasadas ({brl(atrasado)}) ou
            programar um resgate das aplicações.
          </span>
        </p>
      )}

      <Abas
        ativa={aba}
        abas={[
          { valor: 'projecao', rotulo: 'Próximas 8 semanas', href: '/financeiro/fluxo' },
          { valor: 'realizado', rotulo: 'Realizado por mês', href: '/financeiro/fluxo?aba=realizado' },
        ]}
      />

      {aba === 'realizado' ? (
        <>
          <GraficoFluxo dados={mensal.map((m) => ({ rotulo: formatarMes(m.mes), entradas: m.entradas, saidas: m.saidas, saldo: m.saldo }))} />
          <p className="mt-3 text-xs text-subtle">Inclui aplicações e resgates, retiradas das sócias e mútuo entre empresas: é o extrato da conta.</p>
        </>
      ) : zoom >= 0 ? (
        <ZoomDaSemana semana={semanas[zoom]} anterior={semanas[zoom - 1]} proxima={semanas[zoom + 1]} hoje={dia} />
      ) : (
        <>
          <GraficoFluxo
            dados={semanas.map((s) => ({ rotulo: formatarDataCurta(s.inicio), entradas: s.entradas, saidas: s.saidas, saldo: s.saldoFinal }))}
            links={semanas.map(linkDaSemana)}
          />
          <p className="mb-6 mt-3 text-xs text-subtle">
            Clique numa semana (no gráfico ou na tabela) para ver dia a dia. Notas a receber pela previsão, parcelas liberadas e despesas fixas pela média dos últimos 3
            meses. Fora da projeção: {brl(atrasado)} em notas atrasadas, mútuo, imobilizado e distribuições extras de lucro.
          </p>
          <Card flush>
            <table className="tabela">
              <thead>
                <tr>
                  <th>Semana</th>
                  <th className="num">Entradas</th>
                  <th className="num">Saídas</th>
                  <th className="num">Saldo no fim</th>
                  <th>O que mexe no caixa</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {semanas.map((semana) => (
                  <tr key={semana.inicio}>
                    <td className="whitespace-nowrap">
                      <Link href={linkDaSemana(semana)} className="link">
                        {formatarDataCurta(semana.inicio)} a {formatarDataCurta(semana.fim)}
                      </Link>
                    </td>
                    <td className="num text-ok">{brl(semana.entradas)}</td>
                    <td className="num">{brl(semana.saidas)}</td>
                    <td className={cn('num font-medium', semana.saldoFinal < 0 && 'text-danger')}>{brl(semana.saldoFinal)}</td>
                    <td className="min-w-72">
                      <Expansivel resumo={contar(semana.movimentos.length, 'movimento', 'movimentos')}>
                        <ul className="space-y-1 text-xs">
                          {semana.movimentos.map((m, i) => (
                            <li key={i} className="flex justify-between gap-4">
                              <span className="text-muted">
                                {formatarData(m.data)} · {m.descricao}
                              </span>
                              <span className={cn('tabular-nums', m.valor > 0 && 'text-ok')}>{brl(m.valor)}</span>
                            </li>
                          ))}
                        </ul>
                      </Expansivel>
                    </td>
                    <AbrirLinha href={linkDaSemana(semana)} rotulo={`Ver a semana de ${formatarDataCurta(semana.inicio)} dia a dia`} />
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </>
      )}
    </>
  )
}

/** A semana dia a dia (`?semana=`): gráfico por dia e, embaixo, os movimentos de cada dia. */
function ZoomDaSemana({ semana, anterior, proxima, hoje }: { semana: SemanaFluxo; anterior?: SemanaFluxo; proxima?: SemanaFluxo; hoje: string }) {
  const dias = diasDaSemana(semana)
  const comMovimento = dias.filter((d) => d.movimentos.length)
  const saldoInicial = semana.saldoFinal - semana.entradas - semana.saidas
  const seta = (alvo: SemanaFluxo | undefined, rotulo: string, Icone: LucideIcon) =>
    alvo ? (
      <Link href={linkDaSemana(alvo)} scroll={false} aria-label={rotulo} title={rotulo} className="rounded-md p-1.5 text-muted hover:bg-surface hover:text-ink">
        <Icone className="size-4" />
      </Link>
    ) : (
      <span className="p-1.5 text-line">
        <Icone className="size-4" />
      </span>
    )

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <Link href="/financeiro/fluxo" scroll={false} className="inline-flex items-center gap-1 text-sm text-muted hover:text-ink">
          <ArrowLeft className="size-4" /> As 8 semanas
        </Link>
        <nav aria-label="Semana" className="inline-flex items-center">
          {seta(anterior, 'Semana anterior', ChevronLeft)}
          <span className="px-1 text-sm font-medium tabular-nums text-ink">
            Semana de {formatarDataCurta(semana.inicio)} a {formatarDataCurta(semana.fim)}
          </span>
          {seta(proxima, 'Próxima semana', ChevronRight)}
        </nav>
      </div>
      <p className="mb-4 text-sm text-muted">
        Começa com {brl(saldoInicial)}, entram <span className="text-ok">{brl(semana.entradas)}</span>, saem {brl(-semana.saidas)} e termina com{' '}
        <strong className={cn('font-semibold', semana.saldoFinal < 0 ? 'text-danger' : 'text-ink')}>{brl(semana.saldoFinal)}</strong>.
      </p>

      {/* Sem a linha do saldo: na escala dele, o aluguel do dia 5 nem aparece. O saldo de cada dia vai na lista. */}
      <GraficoFluxo dados={dias.map((d) => ({ rotulo: formatarDiaEData(d.data), entradas: d.entradas, saidas: d.saidas, saldo: d.saldoFinal }))} saldo={false} altura={240} />
      {semana.inicio < hoje && (
        <p className="mt-3 text-xs text-subtle">
          A projeção começa hoje; o que já passou nesta semana está em{' '}
          <Link href="/financeiro/lancamentos" className="link">
            Lançamentos
          </Link>
          .
        </p>
      )}

      <div className="mt-6 space-y-5">
        {comMovimento.map((d) => (
          <section key={d.data}>
            <div className="mb-1.5 flex flex-wrap items-baseline justify-between gap-x-3">
              <h3 className="font-medium text-ink">{formatarDataLonga(d.data)}</h3>
              <span className="text-sm text-muted">
                saldo no fim do dia <span className={cn('font-medium tabular-nums', d.saldoFinal < 0 ? 'text-danger' : 'text-ink')}>{brl(d.saldoFinal)}</span>
              </span>
            </div>
            <Lista>
              {d.movimentos.map((m, i) => (
                <Linha key={i}>
                  <span className="min-w-0 flex-1">{m.descricao}</span>
                  <span className={cn('font-medium tabular-nums', m.valor > 0 && 'text-ok')}>{brl(m.valor)}</span>
                </Linha>
              ))}
            </Lista>
          </section>
        ))}
        {comMovimento.length === 0 && <p className="text-sm text-muted">Nada previsto nesta semana.</p>}
        {comMovimento.length > 0 && comMovimento.length < 7 && <p className="text-xs text-subtle">Os outros dias não têm nada previsto.</p>}
      </div>
    </>
  )
}

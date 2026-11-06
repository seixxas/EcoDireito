import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import { LinkRapido } from '@/components/ui/link-rapido'
import { GraficoFluxo } from '@/components/charts/grafico-fluxo'
import { GraficoSaldo } from '@/components/charts/grafico-saldo'
import { Abas } from '@/components/ui/abas'
import { Card } from '@/components/ui/card'
import { Expansivel } from '@/components/ui/expansivel'
import { classeBotao } from '@/components/ui/form'
import { Linha, Lista } from '@/components/ui/lista'
import { PageHeader } from '@/components/ui/page-header'
import { projecaoDeCaixa } from '@/data/financeiro'
import { diasDaSemana, type SemanaFluxo } from '@/domain/financeiro/fluxo'
import { cn } from '@/lib/cn'
import { somar } from '@/lib/dinheiro'
import { brl, contar, formatarData, formatarDataCurta, formatarDataLonga, formatarDiaEData, formatarMes } from '@/lib/formatar'
import { NoCartao, TABELA_EMPILHADA } from '../_components/tabela-empilhada'

export const metadata: Metadata = { title: 'Fluxo de caixa' }

const linkDaSemana = (semana: SemanaFluxo) => `/financeiro/fluxo?semana=${semana.inicio}`

/** "+ R$ 10,00" e "− R$ 10,00": o sinal diz o lado sem depender da cor. */
const comSinal = (valor: number) => (valor > 0 ? `+ ${brl(valor)}` : valor < 0 ? `− ${brl(-valor)}` : brl(0))

function NaConta({ rotulo, valor, detalhe, cor, fundo = 'bg-surface' }: { rotulo: string; valor: string; detalhe: string; cor?: string; fundo?: string }) {
  return (
    <div className={cn('rounded-lg px-3.5 py-3.5', fundo)}>
      <p className="text-xs font-semibold text-subtle">{rotulo}</p>
      <p className={cn('mt-0.5 text-lg font-semibold', cor)}>{valor}</p>
      <p className="mt-0.5 text-2xs text-muted">{detalhe}</p>
    </div>
  )
}

function Sinal({ children }: { children: ReactNode }) {
  return (
    <span aria-hidden="true" className="hidden text-center text-[1.875rem] font-semibold text-subtle xl:block">
      {children}
    </span>
  )
}

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

      <section aria-label="Conta das próximas 8 semanas" className="grid items-center gap-3 rounded-xl bg-painel px-6 py-5.5 sm:grid-cols-2 xl:grid-cols-[1fr_auto_1fr_auto_1fr_auto_1fr]">
        <NaConta rotulo="Saldo hoje" valor={brl(saldoHoje)} detalhe={`mais ${brl(aplicado)} aplicados`} />
        <Sinal>+</Sinal>
        <NaConta rotulo="Entradas previstas" valor={brl(entradas)} detalhe="próximas 8 semanas" cor="text-ok" />
        <Sinal>−</Sinal>
        <NaConta rotulo="Saídas previstas" valor={brl(-saidas)} detalhe="próximas 8 semanas" />
        <Sinal>=</Sinal>
        <NaConta
          rotulo={`Saldo em ${formatarDataCurta(ultima.fim)}`}
          valor={brl(ultima.saldoFinal)}
          detalhe="se nada mudar"
          cor={ultima.saldoFinal < 0 ? 'text-danger' : undefined}
          fundo={ultima.saldoFinal < 0 ? 'bg-danger-soft' : 'bg-warn-soft'}
        />
      </section>

      {menor.saldoFinal < saldoHoje / 2 && (
        <div role="note" className="mt-6 flex flex-wrap items-center justify-between gap-4 rounded-lg border-2 border-warn bg-warn-soft px-5 py-4">
          <p className="max-w-[80ch]">
            <strong className="font-semibold text-warn">Atenção:</strong> o saldo chega a {brl(menor.saldoFinal)} na semana de {formatarDataCurta(menor.inicio)}. Dá para antecipar a
            cobrança das notas atrasadas ({brl(atrasado)}) ou programar um resgate das aplicações.
          </p>
          <LinkRapido href="/financeiro?aba=atrasadas" className={classeBotao('secundario')}>
            Ver notas atrasadas
          </LinkRapido>
        </div>
      )}

      <Abas
        className="mb-6 mt-9 w-fit"
        ativa={aba}
        abas={[
          { valor: 'projecao', rotulo: 'Próximas 8 semanas', href: '/financeiro/fluxo' },
          { valor: 'realizado', rotulo: 'Realizado por mês', href: '/financeiro/fluxo?aba=realizado' },
        ]}
      />

      {aba === 'realizado' ? (
        <Card titulo="Entradas, saídas e saldo de cada mês">
          <GraficoFluxo dados={mensal.map((m) => ({ rotulo: formatarMes(m.mes), entradas: m.entradas, saidas: m.saidas, saldo: m.saldo }))} />
          <p className="mt-3 text-xs text-muted">Inclui aplicações e resgates, retiradas das sócias e mútuo entre empresas: é o extrato da conta.</p>
        </Card>
      ) : zoom >= 0 ? (
        <ZoomDaSemana semana={semanas[zoom]} anterior={semanas[zoom - 1]} proxima={semanas[zoom + 1]} hoje={dia} />
      ) : (
        <>
          <Card titulo="Saldo no fim de cada semana">
            <GraficoSaldo dados={semanas.map((s) => ({ rotulo: formatarDataCurta(s.inicio), saldo: s.saldoFinal }))} links={semanas.map(linkDaSemana)} />
            <p className="mt-3 text-xs text-muted">
              {menor === ultima ? 'A última semana' : `A semana de ${formatarDataCurta(menor.inicio)}`} está em {menor.saldoFinal < 0 ? 'vermelho' : 'amarelo'} porque é o menor saldo do
              período. Entradas e saídas de cada semana estão na tabela abaixo. Clique numa semana, no gráfico ou na tabela, para ver dia a dia.
            </p>
          </Card>

          <Card flush className="mt-6">
            <table className={`${TABELA_EMPILHADA} max-[83.75rem]:[&_td:last-child]:w-full`}>
              <thead>
                <tr>
                  <th>Semana</th>
                  <th className="num">Entradas</th>
                  <th className="num">Saídas</th>
                  <th className="num">Saldo no fim</th>
                  <th className="num">Dia a dia</th>
                </tr>
              </thead>
              <tbody>
                {semanas.map((semana) => (
                  <tr key={semana.inicio}>
                    <td className="whitespace-nowrap">
                      <LinkRapido href={linkDaSemana(semana)} className="link inline-flex min-h-12 items-center">
                        {formatarDataCurta(semana.inicio)} a {formatarDataCurta(semana.fim)}
                      </LinkRapido>
                    </td>
                    <td className={cn('num', semana.entradas > 0 && 'text-ok')}>
                      <NoCartao>Entradas</NoCartao>
                      {comSinal(semana.entradas)}
                    </td>
                    <td className="num">
                      <NoCartao>Saídas</NoCartao>
                      {comSinal(semana.saidas)}
                    </td>
                    <td className={cn('num', semana.saldoFinal < 0 && 'text-danger')}>
                      <NoCartao>Saldo no fim</NoCartao>
                      {brl(semana.saldoFinal)}
                    </td>
                    <td className="min-w-[16rem] text-right max-[83.75rem]:text-left">
                      <Expansivel resumo={`Ver ${contar(semana.movimentos.length, 'movimento', 'movimentos')}`}>
                        <ul className="space-y-2 text-left text-xs">
                          {semana.movimentos.map((m, i) => (
                            <li key={i} className="flex justify-between gap-4">
                              <span className="text-muted">
                                {formatarData(m.data)} · {m.descricao}
                              </span>
                              <span className={cn('whitespace-nowrap font-medium', m.valor > 0 && 'text-ok')}>{comSinal(m.valor)}</span>
                            </li>
                          ))}
                        </ul>
                      </Expansivel>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
          <p className="mt-3 max-w-[110ch] text-xs text-muted">
            Notas a receber pela previsão, parcelas liberadas e despesas fixas pela média dos últimos 3 meses. Fora da projeção: {brl(atrasado)} em notas atrasadas, mútuo, imobilizado e
            distribuições extras de lucro.
          </p>
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
  const passo = (alvo: SemanaFluxo | undefined, rotulo: string) =>
    alvo ? (
      <LinkRapido href={linkDaSemana(alvo)} scroll={false} className={classeBotao('secundario')}>
        {rotulo}
      </LinkRapido>
    ) : (
      <span className={classeBotao('secundario', 'cursor-default! border-line! text-subtle! hover:bg-surface!')}>{rotulo}</span>
    )

  return (
    <>
      <LinkRapido href="/financeiro/fluxo" scroll={false} className="link inline-flex min-h-12 items-center text-sm">
        ← As 8 semanas
      </LinkRapido>
      <div className="mb-5 mt-1 flex flex-wrap items-center justify-between gap-x-6 gap-y-3">
        <h2 className="text-xl font-semibold text-ink">
          Semana de {formatarDataCurta(semana.inicio)} a {formatarDataCurta(semana.fim)}
        </h2>
        <nav aria-label="Semana" className="flex flex-wrap gap-3">
          {passo(anterior, '← Semana anterior')}
          {passo(proxima, 'Próxima semana →')}
        </nav>
      </div>
      <p className="mb-5 text-muted">
        Começa com {brl(saldoInicial)}, entram <span className="font-medium text-ok">{brl(semana.entradas)}</span>, saem {brl(-semana.saidas)} e termina com{' '}
        <strong className={cn('font-semibold', semana.saldoFinal < 0 ? 'text-danger' : 'text-ink')}>{brl(semana.saldoFinal)}</strong>.
      </p>

      {/* Sem a linha do saldo: na escala dele, o aluguel do dia 5 nem aparece. O saldo de cada dia vai na lista. */}
      <Card titulo="Entradas e saídas de cada dia">
        <GraficoFluxo dados={dias.map((d) => ({ rotulo: formatarDiaEData(d.data), entradas: d.entradas, saidas: d.saidas, saldo: d.saldoFinal }))} saldo={false} altura={280} />
        {semana.inicio < hoje && (
          <p className="mt-3 text-xs text-muted">
            A projeção começa hoje; o que já passou nesta semana está em{' '}
            <LinkRapido href="/financeiro/lancamentos" className="link">
              Lançamentos
            </LinkRapido>
            .
          </p>
        )}
      </Card>

      <div className="mt-7 space-y-6">
        {comMovimento.map((d) => (
          <section key={d.data}>
            <div className="mb-2 flex flex-wrap items-baseline justify-between gap-x-3">
              <h3 className="text-lg font-semibold text-ink">{formatarDataLonga(d.data)}</h3>
              <span className="text-muted">
                saldo no fim do dia <span className={cn('text-lg font-semibold', d.saldoFinal < 0 ? 'text-danger' : 'text-ink')}>{brl(d.saldoFinal)}</span>
              </span>
            </div>
            <Lista>
              {d.movimentos.map((m, i) => (
                <Linha key={i}>
                  <span className="min-w-0 flex-1 basis-60">{m.descricao}</span>
                  <span className={cn('ml-auto text-[1.25rem] font-semibold', m.valor > 0 && 'text-ok')}>{comSinal(m.valor)}</span>
                </Linha>
              ))}
            </Lista>
          </section>
        ))}
        {comMovimento.length === 0 && <p className="text-muted">Nada previsto nesta semana.</p>}
        {comMovimento.length > 0 && comMovimento.length < 7 && <p className="text-xs text-muted">Os outros dias não têm nada previsto.</p>}
      </div>
    </>
  )
}

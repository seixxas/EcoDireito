import { TriangleAlert } from 'lucide-react'
import type { Metadata } from 'next'
import { GraficoFluxo } from '@/components/charts/grafico-fluxo'
import { Abas } from '@/components/ui/abas'
import { Card } from '@/components/ui/card'
import { Expansivel } from '@/components/ui/expansivel'
import { PageHeader } from '@/components/ui/page-header'
import { ItemResumo, Resumo } from '@/components/ui/resumo'
import { projecaoDeCaixa } from '@/data/financeiro'
import { cn } from '@/lib/cn'
import { somar } from '@/lib/dinheiro'
import { brl, formatarData, formatarDataCurta, formatarMes } from '@/lib/formatar'

export const metadata: Metadata = { title: 'Fluxo de caixa' }

export default async function PaginaFluxo({ searchParams }: { searchParams: Promise<{ aba?: string }> }) {
  const [{ aba: pedida }, { saldoHoje, aplicado, semanas, mensal, atrasado }] = await Promise.all([searchParams, projecaoDeCaixa(8)])
  const aba = pedida === 'realizado' ? 'realizado' : 'projecao'
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
      ) : (
        <>
          <GraficoFluxo dados={semanas.map((s) => ({ rotulo: formatarDataCurta(s.inicio), entradas: s.entradas, saidas: s.saidas, saldo: s.saldoFinal }))} />
          <p className="mb-6 mt-3 text-xs text-subtle">
            Notas a receber pela previsão, parcelas liberadas e despesas fixas pela média dos últimos 3 meses. Fora da projeção: {brl(atrasado)} em notas atrasadas, mútuo,
            imobilizado e distribuições extras de lucro.
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
                </tr>
              </thead>
              <tbody>
                {semanas.map((semana) => (
                  <tr key={semana.inicio}>
                    <td className="whitespace-nowrap">
                      {formatarDataCurta(semana.inicio)} a {formatarDataCurta(semana.fim)}
                    </td>
                    <td className="num text-ok">{brl(semana.entradas)}</td>
                    <td className="num">{brl(semana.saidas)}</td>
                    <td className={cn('num font-medium', semana.saldoFinal < 0 && 'text-danger')}>{brl(semana.saldoFinal)}</td>
                    <td className="min-w-72">
                      <Expansivel resumo={`${semana.movimentos.length} movimentos`}>
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

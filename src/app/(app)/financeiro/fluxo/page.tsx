import { TriangleAlert } from 'lucide-react'
import type { Metadata } from 'next'
import { GraficoFluxo } from '@/components/charts/grafico-fluxo'
import { Card } from '@/components/ui/card'
import { PageHeader } from '@/components/ui/page-header'
import { Stat } from '@/components/ui/stat'
import { projecaoDeCaixa } from '@/data/financeiro'
import { cn } from '@/lib/cn'
import { somar } from '@/lib/dinheiro'
import { brl, formatarData, formatarDataCurta, formatarMes } from '@/lib/formatar'

export const metadata: Metadata = { title: 'Fluxo de caixa' }

export default async function PaginaFluxo() {
  const { saldoHoje, aplicado, semanas, mensal, atrasado } = await projecaoDeCaixa(8)
  const entradas = somar(semanas.map((s) => s.entradas))
  const saidas = somar(semanas.map((s) => s.saidas))
  const ultima = semanas.at(-1)!
  const menor = semanas.reduce((a, b) => (b.saldoFinal < a.saldoFinal ? b : a))

  return (
    <>
      <PageHeader
        titulo="Fluxo de caixa"
        descricao="O que entrou e saiu nos últimos meses e o que deve entrar e sair nas próximas 8 semanas: notas a receber pela previsão, parcelas liberadas e despesas fixas pela média dos últimos 3 meses."
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat rotulo="Saldo hoje" valor={brl(saldoHoje)} detalhe={`mais ${brl(aplicado)} aplicados`} tom="brand" />
        <Stat rotulo="Entradas previstas" valor={brl(entradas)} detalhe="próximas 8 semanas" tom="ok" />
        <Stat rotulo="Saídas previstas" valor={brl(-saidas)} detalhe="próximas 8 semanas" tom="warn" />
        <Stat rotulo={`Saldo em ${formatarDataCurta(ultima.fim)}`} valor={brl(ultima.saldoFinal)} detalhe="se nada mudar" tom={ultima.saldoFinal < 0 ? 'danger' : 'neutral'} />
      </div>

      {menor.saldoFinal < saldoHoje / 2 && (
        <div className="mb-6 flex items-start gap-3 rounded-2xl border border-accent/40 bg-warn-soft px-5 py-4 text-sm text-warn">
          <TriangleAlert className="mt-0.5 size-5 shrink-0" />
          <p>
            <strong>Atenção:</strong> o saldo chega a {brl(menor.saldoFinal)} na semana de {formatarDataCurta(menor.inicio)}. Dá para antecipar a cobrança das notas
            atrasadas ({brl(atrasado)}) ou programar um resgate das aplicações.
          </p>
        </div>
      )}

      <Card titulo="Próximas 8 semanas" className="mb-6">
        <GraficoFluxo dados={semanas.map((s) => ({ rotulo: formatarDataCurta(s.inicio), entradas: s.entradas, saidas: s.saidas, saldo: s.saldoFinal }))} />
        <p className="mt-3 text-xs text-subtle">
          Fora da projeção: {brl(atrasado)} em notas atrasadas, mútuo entre empresas, compra de imobilizado e distribuições extras de lucro.
        </p>
      </Card>

      <Card titulo="Semana a semana" className="mb-6" flush>
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
                <td className="whitespace-nowrap font-medium">
                  {formatarDataCurta(semana.inicio)} a {formatarDataCurta(semana.fim)}
                </td>
                <td className="num text-ok">{brl(semana.entradas)}</td>
                <td className="num text-warn">{brl(semana.saidas)}</td>
                <td className={cn('num font-semibold', semana.saldoFinal < 0 && 'text-danger')}>{brl(semana.saldoFinal)}</td>
                <td className="min-w-72">
                  <details>
                    <summary className="cursor-pointer text-sm text-brand-700">{semana.movimentos.length} movimentos</summary>
                    <ul className="mt-2 space-y-1 text-xs">
                      {semana.movimentos.map((m, i) => (
                        <li key={i} className="flex justify-between gap-4">
                          <span className="text-muted">
                            {formatarData(m.data)} · {m.descricao}
                          </span>
                          <span className={cn('tabular-nums', m.valor > 0 ? 'text-ok' : 'text-warn')}>{brl(m.valor)}</span>
                        </li>
                      ))}
                    </ul>
                  </details>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <Card titulo="Realizado por mês">
        <GraficoFluxo dados={mensal.map((m) => ({ rotulo: formatarMes(m.mes), entradas: m.entradas, saidas: m.saidas, saldo: m.saldo }))} />
        <p className="mt-3 text-xs text-subtle">Inclui aplicações e resgates, retiradas das sócias e mútuo entre empresas: é o extrato da conta.</p>
      </Card>
    </>
  )
}

import type { Metadata } from 'next'
import { GraficoBarras } from '@/components/charts/grafico-barras'
import { Card } from '@/components/ui/card'
import { PageHeader } from '@/components/ui/page-header'
import { listarNotas } from '@/data/financeiro'
import { exigirArea } from '@/data/sessao'
import { mesDe } from '@/lib/datas'
import { somar } from '@/lib/dinheiro'
import { brl, formatarMes } from '@/lib/formatar'

export const metadata: Metadata = { title: 'Faturado × recebido' }

export default async function PaginaFaturadoRecebido() {
  const [{ meses, notas }] = await Promise.all([listarNotas(), exigirArea('financeiro')])
  const dados = meses.map((m) => ({
    rotulo: formatarMes(m),
    faturado: somar(notas.filter(({ nota }) => !nota.cancelada && mesDe(nota.emissao) === m).map(({ nota }) => nota.valor)),
    recebido: somar(notas.filter(({ nota }) => nota.recebimento && mesDe(nota.recebimento.data) === m).map(({ nota }) => nota.recebimento!.valor)),
  }))
  const totalFaturado = somar(dados.map((d) => d.faturado))
  const totalRecebido = somar(dados.map((d) => d.recebido))

  return (
    <>
      <PageHeader titulo="Faturado × recebido" voltar={{ href: '/financeiro', rotulo: 'Voltar para o Faturamento' }} resumo="Quanto foi emitido e quanto entrou na conta, mês a mês." />
      <div className="grid items-start gap-3 xl:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
      <Card>
        <GraficoBarras
            altura={420}
            dados={dados}
            series={[
              { chave: 'faturado', nome: 'Faturado (emissão)', cor: 'var(--color-brand-700)' },
              { chave: 'recebido', nome: 'Recebido (caixa)', cor: 'var(--color-brand-300)' },
            ]}
          />
        <dl className="mt-3 grid grid-cols-2 gap-2 border-t border-line pt-3">
          <div className="rounded-lg bg-brand-50 px-3 py-2">
            <dt className="flex items-center gap-1.5 text-xs font-semibold text-subtle">
              <span aria-hidden="true" className="size-2.5 rounded-sm bg-brand-700" /> Total faturado
            </dt>
            <dd className="text-lg font-semibold text-ink">{brl(totalFaturado)}</dd>
          </div>
          <div className="rounded-lg bg-brand-50 px-3 py-2">
            <dt className="flex items-center gap-1.5 text-xs font-semibold text-subtle">
              <span aria-hidden="true" className="size-2.5 rounded-sm bg-brand-300" /> Total recebido
            </dt>
            <dd className="text-lg font-semibold text-ink">{brl(totalRecebido)}</dd>
          </div>
        </dl>
      </Card>
      <Card flush>
        <div className="overflow-x-auto">
          <table className="tabela min-w-0">
            <thead>
              <tr>
                <th>Mês</th>
                <th className="num">Faturado (emissão)</th>
                <th className="num">Recebido (caixa)</th>
              </tr>
            </thead>
            <tbody>
              {dados.map(({ rotulo, faturado, recebido }) => (
                <tr key={rotulo}>
                  <td>{rotulo}</td>
                  <td className="num">{brl(faturado)}</td>
                  <td className="num">{brl(recebido)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-line font-semibold text-ink">
                <td>Total</td>
                <td className="num">{brl(totalFaturado)}</td>
                <td className="num">{brl(totalRecebido)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </Card>
      </div>
    </>
  )
}

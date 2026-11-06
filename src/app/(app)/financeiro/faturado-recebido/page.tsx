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

  return (
    <>
      <PageHeader titulo="Faturado × recebido" voltar={{ href: '/financeiro', rotulo: 'Voltar para o Faturamento' }} resumo="Quanto foi emitido e quanto entrou na conta, mês a mês." />
      <Card className="mb-6">
        {/* O gráfico é comum e escreve em 12 px; aqui a letra sobe para 16. */}
        <div className="[&_.recharts-cartesian-axis-tick-value]:text-[1rem] [&_.recharts-legend-wrapper]:text-base! [&_.recharts-tooltip-wrapper_*]:text-base!">
          <GraficoBarras
            altura={360}
            dados={dados}
            series={[
              { chave: 'faturado', nome: 'Faturado (emissão)', cor: 'var(--color-brand-700)' },
              { chave: 'recebido', nome: 'Recebido (caixa)', cor: 'var(--color-brand-300)' },
            ]}
          />
        </div>
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
          </table>
        </div>
      </Card>
    </>
  )
}

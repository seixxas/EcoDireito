import type { Metadata } from 'next'
import { Card } from '@/components/ui/card'
import { PageHeader } from '@/components/ui/page-header'
import { SegmentedLinks } from '@/components/ui/segmented-links'
import { dadosDaDre } from '@/data/financeiro'
import { montarDre, type Regime } from '@/domain/financeiro/dre'
import { cn } from '@/lib/cn'
import { brlInteiro, formatarMes, formatarPercentual } from '@/lib/formatar'

export const metadata: Metadata = { title: 'DRE' }

const REGIMES: Record<Regime, { rotulo: string; explicacao: string }> = {
  caixa: { rotulo: 'Por caixa', explicacao: 'Cada valor no mês em que o dinheiro entrou ou saiu da conta.' },
  competencia: { rotulo: 'Por competência', explicacao: 'Receita no mês em que a nota foi emitida; impostos no mês a que se referem.' },
}

export default async function PaginaDre({ searchParams }: { searchParams: Promise<{ regime?: string }> }) {
  const { regime: pedido } = await searchParams
  const regime: Regime = pedido === 'competencia' ? 'competencia' : 'caixa'
  const { meses, notas, lancamentos } = await dadosDaDre()
  const linhas = montarDre({ lancamentos, notas, meses, regime })
  const receitaLiquida = linhas.find((l) => l.id === 'subtotal-imposto')?.total ?? 0

  return (
    <>
      <PageHeader
        titulo="DRE"
        descricao={`Na mesma estrutura que a Eco Direito já usa, montada direto dos lançamentos. ${REGIMES[regime].explicacao}`}
        acoes={
          <SegmentedLinks
            ativo={regime}
            opcoes={Object.entries(REGIMES).map(([valor, { rotulo }]) => ({ valor, rotulo, href: valor === 'caixa' ? '/financeiro/dre' : `/financeiro/dre?regime=${valor}` }))}
          />
        }
      />
      <Card flush>
        <table className="tabela">
          <thead>
            <tr>
              <th className="sticky left-0 bg-surface">Conta</th>
              {meses.map((mes) => (
                <th key={mes} className="num">
                  {formatarMes(mes)}
                </th>
              ))}
              <th className="num">Total</th>
              <th className="num">% receita líq.</th>
            </tr>
          </thead>
          <tbody>
            {linhas.map((linha) =>
              linha.tipo === 'secao' ? (
                <tr key={linha.id} className="bg-canvas">
                  <td colSpan={meses.length + 3} className="sticky left-0 bg-canvas pt-4 text-xs font-semibold uppercase tracking-wide text-subtle">
                    {linha.nome}
                  </td>
                </tr>
              ) : (
                <tr key={linha.id} className={cn(linha.tipo === 'subtotal' && 'bg-brand-50/60 font-semibold')}>
                  <td className={cn('sticky left-0 min-w-56 whitespace-nowrap', linha.tipo === 'subtotal' ? 'bg-brand-50 text-brand-900' : 'bg-surface pl-8')}>{linha.nome}</td>
                  {linha.valores.map((valor, i) => (
                    <td key={meses[i]} className={cn('num', valor < 0 && linha.tipo === 'subtotal' && 'text-danger', valor === 0 && 'text-subtle')}>
                      {brlInteiro(valor)}
                    </td>
                  ))}
                  <td className={cn('num font-semibold', linha.total < 0 && linha.tipo === 'subtotal' && 'text-danger')}>{brlInteiro(linha.total)}</td>
                  <td className="num text-muted">{receitaLiquida ? formatarPercentual(linha.total / receitaLiquida) : '—'}</td>
                </tr>
              ),
            )}
          </tbody>
        </table>
      </Card>
    </>
  )
}

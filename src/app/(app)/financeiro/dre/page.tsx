import type { Metadata } from 'next'
import { Card } from '@/components/ui/card'
import { PageHeader } from '@/components/ui/page-header'
import { SegmentedLinks } from '@/components/ui/segmented-links'
import { dadosDaDre } from '@/data/financeiro'
import { montarDre, type Regime } from '@/domain/financeiro/dre'
import { brl, formatarMes, formatarPercentual } from '@/lib/formatar'
import { TabelaDre } from './_components/tabela-dre'

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
  const resultado = linhas.find((l) => l.id === 'subtotal-outras')?.total ?? 0

  return (
    <>
      <PageHeader
        titulo="DRE"
        resumo={
          <>
            Resultado líquido de <strong className={resultado < 0 ? 'text-danger' : 'text-ink'}>{brl(resultado)}</strong> de {formatarMes(meses[0])} a{' '}
            {formatarMes(meses.at(-1)!)}
            {receitaLiquida ? `, ${formatarPercentual(resultado / receitaLiquida)} da receita líquida` : ''}. {REGIMES[regime].explicacao}
          </>
        }
        acoes={
          <SegmentedLinks
            ativo={regime}
            opcoes={Object.entries(REGIMES).map(([valor, { rotulo }]) => ({ valor, rotulo, href: valor === 'caixa' ? '/financeiro/dre' : `/financeiro/dre?regime=${valor}` }))}
          />
        }
      />
      <Card flush>
        <TabelaDre meses={meses} linhas={linhas} receitaLiquida={receitaLiquida} />
      </Card>
    </>
  )
}

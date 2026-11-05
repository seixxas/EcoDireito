import { ArrowLeft } from 'lucide-react'
import type { Metadata } from 'next'
import { LinkRapido } from '@/components/ui/link-rapido'
import { GraficoBarras } from '@/components/charts/grafico-barras'
import { PageHeader } from '@/components/ui/page-header'
import { listarNotas } from '@/data/financeiro'
import { exigirArea } from '@/data/sessao'
import { mesDe } from '@/lib/datas'
import { somar } from '@/lib/dinheiro'
import { formatarMes } from '@/lib/formatar'

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
      <LinkRapido href="/financeiro" className="mb-3 inline-flex items-center gap-1 text-sm text-muted hover:text-ink">
        <ArrowLeft className="size-4" /> Faturamento
      </LinkRapido>
      <PageHeader titulo="Faturado × recebido" resumo="Quanto foi emitido e quanto entrou na conta, mês a mês." />
      <GraficoBarras
        dados={dados}
        series={[
          { chave: 'faturado', nome: 'Faturado (emissão)', cor: 'var(--color-brand-700)' },
          { chave: 'recebido', nome: 'Recebido (caixa)', cor: 'var(--color-brand-300)' },
        ]}
      />
    </>
  )
}

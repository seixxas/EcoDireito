import type { NextRequest } from 'next/server'
import { dadosDaDre } from '@/data/financeiro'
import { exigirArea } from '@/data/sessao'
import { csvDaDre, montarDre, periodosDaDre } from '@/domain/financeiro/dre'
import { mesDe } from '@/lib/datas'

/** "Exportar para Excel": a DRE do regime e do período da tela. O byte inicial (BOM) faz o Excel ler o arquivo como UTF-8 e manter os acentos. */
export async function GET(request: NextRequest) {
  await exigirArea('financeiro')
  const { searchParams } = request.nextUrl
  const { hoje, meses, notas, lancamentos } = await dadosDaDre()
  const regime = searchParams.get('regime') === 'competencia' ? 'competencia' : 'caixa'
  const periodos = periodosDaDre(meses, mesDe(hoje))
  const periodo = periodos.find((p) => p.id === searchParams.get('periodo')) ?? periodos[0]
  const csv = csvDaDre(montarDre({ lancamentos, notas, meses: periodo.meses, regime }), periodo.meses)
  return new Response(`﻿${csv}`, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="dre-eco-direito-${regime}-${periodo.id}.csv"`,
      'Cache-Control': 'no-store',
    },
  })
}

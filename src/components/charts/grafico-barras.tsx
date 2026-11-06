'use client'

import { Bar, BarChart, CartesianGrid, Legend, Tooltip, XAxis, YAxis } from 'recharts'
import { brlCompacto } from '@/lib/formatar'
import { DICA, LEGENDA, TEXTO_DO_EIXO } from './estilo'

export type Serie = { chave: string; nome: string; cor: string }

/** Barras agrupadas por período. Valores em centavos. */
export function GraficoBarras({ dados, series, altura = 340 }: { dados: Record<string, string | number>[]; series: Serie[]; altura?: number }) {
  return (
    <BarChart responsive style={{ width: '100%', height: altura }} data={dados} margin={{ top: 8, right: 8, left: 0, bottom: 0 }} barGap={3}>
      <CartesianGrid vertical={false} stroke="var(--color-line)" />
      <XAxis dataKey="rotulo" tickLine={false} axisLine={false} tickMargin={6} tick={TEXTO_DO_EIXO} />
      <YAxis tickFormatter={(valor) => brlCompacto(Number(valor))} tickLine={false} axisLine={false} width="auto" tick={TEXTO_DO_EIXO} />
      <Tooltip {...DICA} />
      <Legend {...LEGENDA} />
      {series.map((serie) => (
        <Bar key={serie.chave} dataKey={serie.chave} name={serie.nome} fill={serie.cor} radius={[6, 6, 0, 0]} maxBarSize={34} />
      ))}
    </BarChart>
  )
}

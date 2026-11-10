'use client'

import { Bar, BarChart, CartesianGrid, Legend, Tooltip, XAxis, YAxis } from 'recharts'
import { brlCompacto } from '@/lib/formatar'
import { DICA, Degrades, LEGENDA, TEXTO_DO_EIXO, useIdDoGrafico } from './estilo'

export type Serie = { chave: string; nome: string; cor: string }

/** Barras agrupadas por período. Valores em centavos. */
export function GraficoBarras({ dados, series, altura = 260 }: { dados: Record<string, string | number>[]; series: Serie[]; altura?: number }) {
  const id = useIdDoGrafico()
  return (
    <BarChart responsive style={{ width: '100%', height: altura }} data={dados} margin={{ top: 8, right: 8, left: 0, bottom: 0 }} barGap={3}>
      <Degrades degrades={series.map((serie) => ({ id: `${id}-${serie.chave}`, cor: serie.cor }))} />
      <CartesianGrid vertical={false} stroke="var(--color-line)" />
      <XAxis dataKey="rotulo" tickLine={false} axisLine={false} tickMargin={6} tick={TEXTO_DO_EIXO} />
      <YAxis tickFormatter={(valor) => brlCompacto(Number(valor))} tickLine={false} axisLine={false} width="auto" tick={TEXTO_DO_EIXO} />
      <Tooltip {...DICA} />
      <Legend {...LEGENDA} />
      {series.map((serie) => (
        <Bar key={serie.chave} dataKey={serie.chave} name={serie.nome} fill={`url(#${id}-${serie.chave})`} radius={[3, 3, 0, 0]} maxBarSize={28} />
      ))}
    </BarChart>
  )
}

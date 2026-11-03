'use client'

import { Bar, BarChart, CartesianGrid, Legend, Tooltip, XAxis, YAxis } from 'recharts'
import { brl, brlCompacto } from '@/lib/formatar'

export type Serie = { chave: string; nome: string; cor: string }

/** Barras agrupadas por período. Valores em centavos. */
export function GraficoBarras({ dados, series, altura = 280 }: { dados: Record<string, string | number>[]; series: Serie[]; altura?: number }) {
  return (
    <BarChart responsive style={{ width: '100%', height: altura }} data={dados} margin={{ top: 8, right: 8, left: 0, bottom: 0 }} barGap={3}>
      <CartesianGrid vertical={false} stroke="var(--color-line)" />
      <XAxis dataKey="rotulo" tickLine={false} axisLine={false} tick={{ fill: 'var(--color-subtle)', fontSize: 12 }} />
      <YAxis tickFormatter={(valor) => brlCompacto(Number(valor))} tickLine={false} axisLine={false} width={76} tick={{ fill: 'var(--color-subtle)', fontSize: 12 }} />
      <Tooltip
        formatter={(valor) => brl(Number(valor))}
        cursor={{ fill: 'var(--color-canvas)' }}
        contentStyle={{ borderRadius: 12, borderColor: 'var(--color-line)', fontSize: 13 }}
      />
      <Legend iconType="circle" wrapperStyle={{ fontSize: 13 }} />
      {series.map((serie) => (
        <Bar key={serie.chave} dataKey={serie.chave} name={serie.nome} fill={serie.cor} radius={[4, 4, 0, 0]} maxBarSize={30} />
      ))}
    </BarChart>
  )
}

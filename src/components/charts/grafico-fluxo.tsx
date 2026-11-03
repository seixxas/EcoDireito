'use client'

import { Bar, CartesianGrid, ComposedChart, Legend, Line, ReferenceLine, Tooltip, XAxis, YAxis } from 'recharts'
import { brl, brlCompacto } from '@/lib/formatar'

export type PontoFluxo = { rotulo: string; entradas: number; saidas: number; saldo: number }

/** Entradas e saídas em barras (saídas negativas) e o saldo em linha. Valores em centavos. */
export function GraficoFluxo({ dados, altura = 300 }: { dados: PontoFluxo[]; altura?: number }) {
  return (
    <ComposedChart responsive style={{ width: '100%', height: altura }} data={dados} margin={{ top: 8, right: 8, left: 0, bottom: 0 }} stackOffset="sign">
      <CartesianGrid vertical={false} stroke="var(--color-line)" />
      <XAxis dataKey="rotulo" tickLine={false} axisLine={false} tick={{ fill: 'var(--color-subtle)', fontSize: 12 }} />
      <YAxis tickFormatter={(valor) => brlCompacto(Number(valor))} tickLine={false} axisLine={false} width={76} tick={{ fill: 'var(--color-subtle)', fontSize: 12 }} />
      <Tooltip
        formatter={(valor) => brl(Number(valor))}
        cursor={{ fill: 'var(--color-canvas)' }}
        contentStyle={{ borderRadius: 12, borderColor: 'var(--color-line)', fontSize: 13 }}
      />
      <Legend iconType="circle" wrapperStyle={{ fontSize: 13 }} />
      <ReferenceLine y={0} stroke="var(--color-subtle)" />
      <Bar dataKey="entradas" name="Entradas" stackId="movimento" fill="var(--color-brand-300)" maxBarSize={34} radius={[4, 4, 0, 0]} />
      <Bar dataKey="saidas" name="Saídas" stackId="movimento" fill="var(--color-accent)" maxBarSize={34} radius={[4, 4, 0, 0]} />
      <Line dataKey="saldo" name="Saldo no fim" stroke="var(--color-brand-700)" strokeWidth={2.5} dot={{ r: 3 }} type="monotone" />
    </ComposedChart>
  )
}

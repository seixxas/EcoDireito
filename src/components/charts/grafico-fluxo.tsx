'use client'

import { Bar, CartesianGrid, ComposedChart, Legend, Line, ReferenceLine, Tooltip, XAxis, YAxis } from 'recharts'
import { brlCompacto } from '@/lib/formatar'
import { AMARELO, DICA, LEGENDA, TEXTO_DO_EIXO } from './estilo'

export type PontoFluxo = { rotulo: string; entradas: number; saidas: number; saldo: number }

/** Entradas e saídas em barras (saídas negativas) e o saldo em linha. Valores em centavos. Sem `saldo`, só as barras (o eixo fica na escala delas). */
export function GraficoFluxo({ dados, altura = 340, saldo = true }: { dados: PontoFluxo[]; altura?: number; saldo?: boolean }) {
  return (
    <ComposedChart responsive style={{ width: '100%', height: altura }} data={dados} margin={{ top: 8, right: 8, left: 0, bottom: 0 }} stackOffset="sign">
      <CartesianGrid vertical={false} stroke="var(--color-line)" />
      <XAxis dataKey="rotulo" tickLine={false} axisLine={false} tickMargin={6} tick={TEXTO_DO_EIXO} />
      <YAxis tickFormatter={(valor) => brlCompacto(Number(valor))} tickLine={false} axisLine={false} width="auto" tick={TEXTO_DO_EIXO} />
      <Tooltip {...DICA} />
      <Legend {...LEGENDA} />
      <ReferenceLine y={0} stroke="var(--color-campo)" strokeWidth={2} />
      <Bar dataKey="entradas" name="Entradas" stackId="movimento" fill="var(--color-brand-500)" maxBarSize={44} radius={[6, 6, 0, 0]} />
      <Bar dataKey="saidas" name="Saídas" stackId="movimento" fill={AMARELO} maxBarSize={44} radius={[6, 6, 0, 0]} />
      {saldo && (
        <Line
          dataKey="saldo"
          name="Saldo no fim"
          stroke="var(--color-ink)"
          strokeWidth={2.5}
          dot={{ r: 4, fill: 'var(--color-ink)', stroke: 'var(--color-painel)', strokeWidth: 2 }}
          type="monotone"
        />
      )}
    </ComposedChart>
  )
}

'use client'

import { Area, Bar, CartesianGrid, ComposedChart, Legend, Line, ReferenceLine, Tooltip, XAxis, YAxis } from 'recharts'
import { brlCompacto } from '@/lib/formatar'
import { AMARELO, DICA, Degrades, LEGENDA, TEXTO_DO_EIXO, useIdDoGrafico } from './estilo'

export type PontoFluxo = { rotulo: string; entradas: number; saidas: number; saldo: number }

/** Entradas e saídas em barras (saídas negativas) e o saldo em linha. Valores em centavos. Sem `saldo`, só as barras (o eixo fica na escala delas). */
export function GraficoFluxo({ dados, altura = 240, saldo = true }: { dados: PontoFluxo[]; altura?: number; saldo?: boolean }) {
  const id = useIdDoGrafico()
  return (
    <ComposedChart responsive style={{ width: '100%', height: altura }} data={dados} margin={{ top: 8, right: 8, left: 0, bottom: 0 }} stackOffset="sign">
      <Degrades
        degrades={[
          { id: `${id}-entradas`, cor: 'var(--color-brand-500)' },
          { id: `${id}-saidas`, cor: AMARELO },
          { id: `${id}-saldo`, cor: 'var(--color-brand-500)', topo: 0.2, base: 0 },
        ]}
      />
      <CartesianGrid vertical={false} stroke="var(--color-line)" />
      <XAxis dataKey="rotulo" tickLine={false} axisLine={false} tickMargin={6} tick={TEXTO_DO_EIXO} />
      <YAxis tickFormatter={(valor) => brlCompacto(Number(valor))} tickLine={false} axisLine={false} width="auto" tick={TEXTO_DO_EIXO} />
      <Tooltip {...DICA} />
      <Legend {...LEGENDA} />
      <ReferenceLine y={0} stroke="var(--color-campo)" />
      {/* Área clara sob a linha do saldo, sumindo para baixo: fica atrás das barras e fora da legenda e da dica. */}
      {saldo && <Area dataKey="saldo" type="monotone" stroke="none" fill={`url(#${id}-saldo)`} legendType="none" tooltipType="none" isAnimationActive={false} />}
      <Bar dataKey="entradas" name="Entradas" stackId="movimento" fill={`url(#${id}-entradas)`} maxBarSize={44} radius={[3, 3, 0, 0]} />
      <Bar dataKey="saidas" name="Saídas" stackId="movimento" fill={`url(#${id}-saidas)`} maxBarSize={44} radius={[3, 3, 0, 0]} />
      {saldo && (
        <Line
          dataKey="saldo"
          name="Saldo no fim"
          stroke="var(--color-ink)"
          strokeWidth={2}
          dot={{ r: 3, fill: 'var(--color-ink)', stroke: 'var(--color-painel)', strokeWidth: 2 }}
          type="monotone"
        />
      )}
    </ComposedChart>
  )
}

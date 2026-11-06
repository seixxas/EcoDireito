'use client'

import { useRouter } from 'next/navigation'
import { Bar, BarChart, LabelList, Rectangle, ReferenceLine, Tooltip, XAxis, YAxis, type BarShapeProps } from 'recharts'
import { brlCompacto } from '@/lib/formatar'
import { AMARELO, DICA, TEXTO_DO_EIXO } from './estilo'

export type PontoSaldo = { rotulo: string; saldo: number }

const LARGURA_DA_BARRA = 84
/** Sobra acima da maior barra, para o valor caber em cima dela, mesmo de pé no celular. */
const FOLGA = 1.4

const milSemCentavos = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', notation: 'compact', maximumFractionDigits: 0 })
const saldoCurto = (centavos: number) => (Math.abs(centavos) < 100_000_000 ? milSemCentavos.format(centavos / 100) : brlCompacto(centavos))

/**
 * Saldo por coluna, com o valor escrito em cima, sem depender do mouse. O menor saldo fica amarelo; saldo negativo, vermelho.
 * Valores em centavos. Com `links` (um por ponto), clicar numa coluna abre o link dela.
 */
export function GraficoSaldo({ dados, links, altura = 340 }: { dados: PontoSaldo[]; links?: string[]; altura?: number }) {
  const router = useRouter()
  const saldos = dados.map((ponto) => ponto.saldo)
  const menor = Math.min(...saldos)
  const maior = Math.max(...saldos)
  const corDaBarra = (saldo: number) => (saldo < 0 ? 'var(--color-danger)' : saldo === menor ? AMARELO : 'var(--color-brand-500)')
  const corDoTexto = (saldo: number) => (saldo < 0 ? 'var(--color-danger)' : saldo === menor ? 'var(--color-warn)' : 'var(--color-ink)')

  return (
    <BarChart
      responsive
      style={{ width: '100%', height: altura, cursor: links ? 'pointer' : undefined }}
      data={dados}
      margin={{ top: 8, right: 0, left: 0, bottom: 0 }}
      barCategoryGap="12%"
      onClick={(estado) => {
        const link = estado.activeTooltipIndex == null ? undefined : links?.[Number(estado.activeTooltipIndex)]
        if (link) router.push(link, { scroll: false })
      }}
    >
      <XAxis dataKey="rotulo" tickLine={false} tickMargin={8} axisLine={{ stroke: 'var(--color-campo)', strokeWidth: 2 }} tick={{ ...TEXTO_DO_EIXO, fontWeight: 700 }} />
      <YAxis hide domain={[Math.min(menor, 0) * FOLGA, Math.max(maior, 0) * FOLGA]} />
      <Tooltip {...DICA} />
      {menor < 0 && <ReferenceLine y={0} stroke="var(--color-campo)" strokeWidth={2} />}
      <Bar
        dataKey="saldo"
        name="Saldo no fim"
        maxBarSize={LARGURA_DA_BARRA}
        radius={[8, 8, 0, 0]}
        isAnimationActive={false}
        shape={(barra: BarShapeProps) => <Rectangle {...barra} fill={corDaBarra(saldos[barra.index])} />}
      >
        <LabelList
          dataKey="saldo"
          content={({ x, y, width, height, index }) => {
            const saldo = saldos[index ?? 0]
            const meio = Number(x) + Number(width) / 2
            const deitado = Number(width) >= LARGURA_DA_BARRA
            const ponta = [Number(y), Number(y) + Number(height)]
            const alturaDoTexto = saldo < 0 ? Math.max(...ponta) + (deitado ? 20 : 8) : Math.min(...ponta) - 8
            return (
              <text
                x={meio}
                y={alturaDoTexto}
                textAnchor={deitado ? 'middle' : saldo < 0 ? 'end' : 'start'}
                dominantBaseline={deitado ? undefined : 'central'}
                transform={deitado ? undefined : `rotate(-90 ${meio} ${alturaDoTexto})`}
                fill={corDoTexto(saldo)}
                fontSize={deitado ? 17 : 16}
                fontWeight={800}
              >
                {saldoCurto(saldo)}
              </text>
            )
          }}
        />
      </Bar>
    </BarChart>
  )
}

import { useId } from 'react'
import { brl } from '@/lib/formatar'

/** Cores por variável: o tema escuro troca sozinho. */
export const TEXTO_DO_EIXO = { fill: 'var(--color-subtle)', fontSize: 12 }

/** O amarelo do semáforo some sobre o fundo claro: escurecido com o tom de aviso, a barra continua amarela e aparece. */
export const AMARELO = 'color-mix(in srgb, var(--color-accent) 55%, var(--color-warn))'

export const DICA = {
  formatter: (valor: unknown) => brl(Number(valor)),
  cursor: { fill: 'var(--color-rail)' },
  contentStyle: { borderRadius: 8, borderColor: 'var(--color-line)', background: 'var(--color-surface)', fontSize: 13 },
  labelStyle: { color: 'var(--color-ink)', fontWeight: 600 },
  itemStyle: { color: 'var(--color-ink)' },
}

export const LEGENDA = {
  iconType: 'circle',
  wrapperStyle: { fontSize: 13 },
  formatter: (nome: unknown) => <span style={{ color: 'var(--color-ink)' }}>{String(nome)}</span>,
} as const

/** Id para os degradês de um gráfico: vários gráficos na mesma tela não podem repetir o id do SVG. */
export function useIdDoGrafico() {
  return `grafico-${useId().replace(/[^a-zA-Z0-9-]/g, '')}`
}

export type Degrade = { id: string; cor: string; topo?: number; base?: number }

/**
 * Degradês de cima para baixo: a cor cheia em cima, sumindo embaixo, como luz sobre a copa. Vai dentro do gráfico (o recharts aceita `<defs>`).
 * Cor por variável: o tema escuro troca sozinho.
 */
export function Degrades({ degrades }: { degrades: Degrade[] }) {
  return (
    <defs>
      {degrades.map(({ id, cor, topo = 1, base = 0.55 }) => (
        <linearGradient key={id} id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" style={{ stopColor: cor, stopOpacity: topo }} />
          <stop offset="100%" style={{ stopColor: cor, stopOpacity: base }} />
        </linearGradient>
      ))}
    </defs>
  )
}

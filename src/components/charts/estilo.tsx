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

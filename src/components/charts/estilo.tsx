import { brl } from '@/lib/formatar'

/** Letra de 16 px para cima e cores por variável: o tema escuro troca sozinho. */
export const TEXTO_DO_EIXO = { fill: 'var(--color-subtle)', fontSize: 16 }

/** O amarelo do semáforo some sobre o fundo claro: escurecido com o tom de aviso, a barra continua amarela e aparece. */
export const AMARELO = 'color-mix(in srgb, var(--color-accent) 55%, var(--color-warn))'

export const DICA = {
  formatter: (valor: unknown) => brl(Number(valor)),
  cursor: { fill: 'var(--color-rail)' },
  contentStyle: { borderRadius: 10, borderColor: 'var(--color-line)', background: 'var(--color-surface)', fontSize: 16 },
  labelStyle: { color: 'var(--color-ink)', fontWeight: 700 },
  itemStyle: { color: 'var(--color-ink)' },
}

export const LEGENDA = {
  iconType: 'circle',
  wrapperStyle: { fontSize: 16 },
  formatter: (nome: unknown) => <span style={{ color: 'var(--color-ink)' }}>{String(nome)}</span>,
} as const

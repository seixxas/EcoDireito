import type { CSSProperties } from 'react'
import { cn } from '@/lib/cn'

/** Curvas de nível em traço claro, para fundo verde (login). No fundo claro das telas, use a classe `relevo`. */
export function CurvasDeNivel({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 800 600" preserveAspectRatio="xMidYMid slice" className={cn('pointer-events-none absolute inset-0 size-full', className)} aria-hidden>
      <g fill="none" stroke="#ffffff" strokeWidth="1.1" strokeOpacity="0.11">
        {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
          <path key={i} d={`M-40 ${90 + i * 62}C120 ${40 + i * 62} 240 ${150 + i * 62} 400 ${95 + i * 62}S660 ${20 + i * 62} 860 ${80 + i * 62}`} />
        ))}
        {[110, 80, 52, 26].map((r) => (
          <ellipse key={r} cx="610" cy="170" rx={r * 1.7} ry={r} />
        ))}
      </g>
    </svg>
  )
}

const FOLHAS = [
  { left: '8%', tamanho: 22, duracao: '22s', atraso: '-4s', deriva: '10vw', giro: '260deg' },
  { left: '24%', tamanho: 14, duracao: '17s', atraso: '-11s', deriva: '6vw', giro: '-200deg' },
  { left: '41%', tamanho: 18, duracao: '25s', atraso: '-2s', deriva: '-8vw', giro: '180deg' },
  { left: '63%', tamanho: 12, duracao: '19s', atraso: '-15s', deriva: '7vw', giro: '300deg' },
  { left: '78%', tamanho: 20, duracao: '23s', atraso: '-8s', deriva: '-6vw', giro: '-240deg' },
  { left: '91%', tamanho: 15, duracao: '20s', atraso: '-18s', deriva: '5vw', giro: '210deg' },
]

/** Algumas folhas caindo bem devagar. Param para quem pediu menos movimento no sistema. */
export function FolhasCaindo() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      {FOLHAS.map((f, i) => (
        <svg
          key={i}
          viewBox="0 0 24 24"
          className="folha-caindo absolute -top-8"
          style={{ left: f.left, width: f.tamanho, height: f.tamanho, '--duracao': f.duracao, '--atraso': f.atraso, '--deriva': f.deriva, '--giro': f.giro } as CSSProperties}
        >
          <path d="M4 20C4 11 10 5 20 4C20 13.5 14 20 4 20Z" fill="#cfeed3" fillOpacity="0.8" />
          <path d="M3 21L14.5 9.5" stroke="#1f6b26" strokeOpacity="0.5" strokeWidth="1.2" strokeLinecap="round" />
        </svg>
      ))}
    </div>
  )
}

import type { CSSProperties } from 'react'

/**
 * Cena do login (10/11): floresta ao amanhecer. A ideia da tela do Ecoamper (uma linha de luz correndo) virou um rio com
 * reflexos correndo até o horizonte. Por cima, curvas de nível como num mapa, neblina, folhas caindo, vagalumes e pássaros.
 * Tudo SVG e CSS (classes `cena-*` no globals.css); com "reduzir movimento" fica parado.
 * Tirados a pedido (10/11): o sol, o movimento com o mouse e os alfinetes.
 */

/** Aleatório com semente: o servidor e o navegador desenham a mesma floresta. */
function sorteio(semente: number) {
  return () => {
    semente = (semente + 0x6d2b79f5) | 0
    let t = Math.imul(semente ^ (semente >>> 15), 1 | semente)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const n = (v: number) => Math.round(v * 10) / 10

/** Pinheiro: três andares de galhos, mais estreito em cima. */
function pinheiro(x: number, base: number, altura: number, largura: number) {
  const andares = [0, 0.3, 0.55].map((inicio, i) => {
    const topo = base - altura * (inicio + 0.45)
    const baseDoAndar = base - altura * inicio - altura * 0.06
    const l = largura * (1 - i * 0.26)
    return `M${n(x - l / 2)} ${n(baseDoAndar)}L${n(x)} ${n(topo)}L${n(x + l / 2)} ${n(baseDoAndar)}Z`
  })
  return `M${n(x - 2)} ${base}V${n(base - altura * 0.15)}H${n(x + 2)}V${base}Z` + andares.join('')
}

/** Árvore de copa redonda: tronco e três bolas de folhagem. */
function copa(x: number, base: number, altura: number) {
  const r = altura * 0.3
  const bola = (cx: number, cy: number, raio: number) =>
    `M${n(cx - raio)} ${n(cy)}a${n(raio)} ${n(raio)} 0 1 0 ${n(raio * 2)} 0a${n(raio)} ${n(raio)} 0 1 0 ${n(-raio * 2)} 0Z`
  return (
    `M${n(x - 3)} ${base}V${n(base - altura * 0.45)}H${n(x + 3)}V${base}Z` +
    bola(x, base - altura + r, r) +
    bola(x - r * 0.75, base - altura + r * 1.7, r * 0.8) +
    bola(x + r * 0.8, base - altura + r * 1.6, r * 0.85)
  )
}

type Arvore = { d: string; x: number }

function floresta(semente: number, de: number, ate: number, base: number, minimo: number, maximo: number, passo: number): Arvore[] {
  const r = sorteio(semente)
  const arvores: Arvore[] = []
  for (let x = de; x < ate; x += passo * (0.6 + r() * 0.8)) {
    const altura = minimo + r() * (maximo - minimo)
    const chao = base + r() * 14
    arvores.push({ x, d: r() < 0.62 ? pinheiro(x, chao, altura, altura * (0.42 + r() * 0.14)) : copa(x, chao, altura * 0.85) })
  }
  return arvores
}

const ARVORES_DO_FUNDO = floresta(7, -30, 1240, 668, 50, 105, 24)
const ARVORES_DO_MEIO = floresta(21, -30, 1240, 742, 80, 150, 46).filter((a) => a.x < 470 || a.x > 790)
const ARVORES_DA_FRENTE = [...floresta(42, -60, 200, 915, 210, 340, 70), ...floresta(43, 1010, 1260, 915, 220, 360, 70)]

/** O rio: nasce largo embaixo e afina até o pé do sol. Margens calculadas ao longo de uma curva. */
function rio() {
  const p = [
    [330, 910],
    [760, 820],
    [440, 700],
    [840, 640],
  ]
  const ponto = (t: number) => {
    const u = 1 - t
    return [0, 1].map((k) => u ** 3 * p[0][k] + 3 * u * u * t * p[1][k] + 3 * u * t * t * p[2][k] + t ** 3 * p[3][k])
  }
  const esquerda: string[] = []
  const direita: string[] = []
  for (let i = 0; i <= 24; i++) {
    const t = i / 24
    const [x, y] = ponto(t)
    const [x2, y2] = ponto(Math.min(1, t + 0.01))
    const [x1, y1] = ponto(Math.max(0, t - 0.01))
    const comprimento = Math.hypot(x2 - x1, y2 - y1) || 1
    const largura = 150 * (1 - t) ** 1.5 + 3
    const nx = (-(y2 - y1) / comprimento) * largura
    const ny = ((x2 - x1) / comprimento) * largura * 0.45
    esquerda.push(`${n(x + nx)} ${n(y + ny)}`)
    direita.unshift(`${n(x - nx)} ${n(y - ny)}`)
  }
  const meio = `M${p[0].join(' ')}C${p[1].join(' ')} ${p[2].join(' ')} ${p[3].join(' ')}`
  return { leito: `M${esquerda.join('L')}L${direita.join('L')}Z`, meio }
}
const RIO = rio()

/** Curvas de nível em volta de dois morros, como numa carta topográfica. */
const CURVAS = [
  ...[1, 2, 3, 4, 5, 6, 7].map((i) => ({ cx: 250, cy: 610, rx: 90 * i, ry: 38 * i, giro: -8 })),
  ...[1, 2, 3, 4, 5].map((i) => ({ cx: 1080, cy: 300, rx: 70 * i, ry: 46 * i, giro: 18 })),
]

const VAGALUMES = Array.from({ length: 18 }, (_, i) => {
  const r = sorteio(100 + i)
  return { x: n(40 + r() * 1120), y: n(640 + r() * 230), raio: n(1.4 + r() * 1.8), atraso: `${n(-r() * 8)}s`, duracao: `${n(5 + r() * 6)}s`, dx: `${n(-20 + r() * 40)}px`, dy: `${n(-30 - r() * 40)}px` }
})

const FOLHAS = [
  { left: '6%', tamanho: 22, duracao: '21s', atraso: '-4s', deriva: '12vw', giro: '280deg', cor: '#a8d5b1' },
  { left: '17%', tamanho: 14, duracao: '16s', atraso: '-11s', deriva: '6vw', giro: '-220deg', cor: '#e8c477' },
  { left: '29%', tamanho: 18, duracao: '24s', atraso: '-2s', deriva: '-7vw', giro: '190deg', cor: '#6cc084' },
  { left: '44%', tamanho: 12, duracao: '18s', atraso: '-15s', deriva: '8vw', giro: '320deg', cor: '#cfeed3' },
  { left: '57%', tamanho: 20, duracao: '22s', atraso: '-8s', deriva: '-5vw', giro: '-250deg', cor: '#a8d5b1' },
  { left: '69%', tamanho: 15, duracao: '19s', atraso: '-18s', deriva: '6vw', giro: '230deg', cor: '#d4a537' },
  { left: '81%', tamanho: 17, duracao: '23s', atraso: '-6s', deriva: '-9vw', giro: '260deg', cor: '#6cc084' },
  { left: '92%', tamanho: 13, duracao: '17s', atraso: '-13s', deriva: '4vw', giro: '-200deg', cor: '#cfeed3' },
]

export function FundoDoLogin() {
  return (
    <div className="cena pointer-events-none absolute inset-0 overflow-hidden">
      <svg aria-hidden className="absolute inset-0 size-full" viewBox="0 0 1200 900" preserveAspectRatio="xMidYMax slice">
        <defs>
          <linearGradient id="cena-ceu" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#071a0f" />
            <stop offset="38%" stopColor="#123923" />
            <stop offset="58%" stopColor="#2f6040" />
            <stop offset="68%" stopColor="#a99a56" />
            <stop offset="74%" stopColor="#e7c27a" />
          </linearGradient>
          <linearGradient id="cena-agua" x1="0" x2="0" y1="910" y2="640" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#1c4746" />
            <stop offset="55%" stopColor="#4f8579" />
            <stop offset="100%" stopColor="#f6dc98" />
          </linearGradient>
          <linearGradient id="cena-neblina" x1="0" x2="1">
            <stop offset="0%" stopColor="#dcebd9" stopOpacity="0" />
            <stop offset="50%" stopColor="#dcebd9" stopOpacity="0.16" />
            <stop offset="100%" stopColor="#dcebd9" stopOpacity="0" />
          </linearGradient>
          <filter id="cena-granulado">
            <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" stitchTiles="stitch" />
            <feColorMatrix values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 0.5 0" />
          </filter>
        </defs>

        {/* Céu */}
        <rect width="1200" height="900" fill="url(#cena-ceu)" />
        {/* Pássaros */}
        <g fill="none" stroke="#0b2416" strokeOpacity="0.55" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          {[
            { y: 250, escala: 1, atraso: '0s' },
            { y: 280, escala: 0.75, atraso: '-1.6s' },
            { y: 232, escala: 0.6, atraso: '-3s' },
          ].map((p, i) => (
            <g key={i} className="cena-passaro" style={{ '--atraso': p.atraso } as CSSProperties}>
              <g transform={`translate(${i * 34} ${p.y}) scale(${p.escala})`}>
                <path d="M-12 0Q-6 -7 0 0Q6 -7 12 0" className="cena-asa" />
              </g>
            </g>
          ))}
        </g>

        {/* Curvas de nível */}
        <g fill="none" stroke="#e8f1e0" strokeWidth="1" className="cena-curvas">
          {CURVAS.map((c, i) => (
            <ellipse key={i} cx={c.cx} cy={c.cy} rx={c.rx} ry={c.ry} transform={`rotate(${c.giro} ${c.cx} ${c.cy})`} strokeOpacity={0.05 + (i % 2) * 0.03} strokeDasharray={i % 3 === 0 ? '2 6' : undefined} />
          ))}
        </g>

        {/* Morros */}
        <g>
          <path d="M-40 600C120 560 240 585 360 570S600 540 760 575S1000 560 1240 590V900H-40Z" fill="#3d6e4c" fillOpacity="0.9" />
          <rect y="585" width="1200" height="60" fill="url(#cena-neblina)" className="cena-neblina" />
        </g>
        <g>
          <path d="M-40 645C140 610 300 640 470 625S760 650 940 630S1120 615 1240 640V900H-40Z" fill="#285639" />
          <g fill="#1d4730">
            {ARVORES_DO_FUNDO.map((a, i) => (
              <path key={i} d={a.d} />
            ))}
          </g>
        </g>

        {/* Árvores do meio e neblina */}
        <g>
          <path d="M-40 730C120 715 260 735 400 742C540 760 700 760 820 735C960 722 1100 730 1240 720V900H-40Z" fill="#163a25" />
          <g fill="#133421">
            {ARVORES_DO_MEIO.map((a, i) => (
              <path key={i} d={a.d} />
            ))}
          </g>
          <rect y="700" width="1200" height="70" fill="url(#cena-neblina)" className="cena-neblina cena-neblina-2" />
        </g>

        {/* Rio com o brilho correndo */}
        <g>
          <path d={RIO.leito} fill="url(#cena-agua)" />
          {/* Reflexos: riscos curtos e irregulares em três faixas, correndo em velocidades diferentes. */}
          {[-14, 0, 12].map((desvio, i) => (
            <path
              key={desvio}
              d={RIO.meio}
              transform={`translate(${desvio} ${desvio * 0.4})`}
              pathLength={1000}
              fill="none"
              stroke="#fff3cf"
              strokeOpacity={0.35 - i * 0.08}
              strokeWidth={1.6 - i * 0.3}
              strokeLinecap="round"
              className="cena-correnteza"
              style={{ animationDuration: `${8 + i * 3}s`, strokeDasharray: ['4 18 12 40', '2 26 8 34', '6 30 3 22'][i] }}
            />
          ))}
        </g>

        {/* Vagalumes */}
        <g fill="#f8e7a6">
          {VAGALUMES.map((v, i) => (
            <circle
              key={i}
              cx={v.x}
              cy={v.y}
              r={v.raio}
              className="cena-vagalume"
              style={{ '--atraso': v.atraso, '--duracao': v.duracao, '--dx': v.dx, '--dy': v.dy } as CSSProperties}
            />
          ))}
        </g>

        {/* Árvores da frente, balançando */}
        <g>
          <path d="M-60 880C200 860 500 900 760 885S1100 865 1260 880V900H-60Z" fill="#081b10" />
          <g fill="#0a2114">
            {ARVORES_DA_FRENTE.map((a, i) => (
              <path key={i} d={a.d} className="cena-balanco" style={{ '--atraso': `${-i * 0.7}s` } as CSSProperties} />
            ))}
          </g>
        </g>

        <rect width="1200" height="900" filter="url(#cena-granulado)" opacity="0.05" />
      </svg>

      {/* Folhas caindo, por cima de tudo */}
      {FOLHAS.map((f, i) => (
        <svg
          key={i}
          aria-hidden
          viewBox="0 0 24 24"
          className="folha-caindo absolute -top-8"
          style={{ left: f.left, width: f.tamanho, height: f.tamanho, '--duracao': f.duracao, '--atraso': f.atraso, '--deriva': f.deriva, '--giro': f.giro } as CSSProperties}
        >
          <path d="M4 20C4 11 10 5 20 4C20 13.5 14 20 4 20Z" fill={f.cor} fillOpacity="0.85" />
          <path d="M3 21L14.5 9.5" stroke="#0b2416" strokeOpacity="0.45" strokeWidth="1.2" strokeLinecap="round" />
        </svg>
      ))}

      {/* Escurece em cima à esquerda, onde fica o texto, e embaixo, onde fica o rodapé */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_0%_20%,rgb(5_20_11/0.7),transparent_60%)]" />
      <div className="absolute inset-x-0 bottom-0 h-32 bg-linear-to-t from-[rgb(5_20_11/0.75)] to-transparent" />
    </div>
  )
}

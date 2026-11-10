/**
 * Fundo do painel do login (pedido de 10/11, a partir da tela do Ecoamper): verde bem escuro, grade de pontinhos,
 * um leque de linhas finas subindo para a direita e uma linha dourada com um brilho que corre até o sol que pulsa.
 * Só SVG e CSS (`fundo-login-*` no globals.css); com "reduzir movimento" fica parado.
 */

const LINHAS = 34

/** Leque de curvas: nascem à esquerda, embaixo, e abrem para cima à direita. */
function curva(i: number) {
  const y0 = 600 + i * 13
  return `M -60 ${y0} C 380 ${y0 + 30 - i * 2}, 760 ${560 - i * 9}, 1260 ${40 + i * 21}`
}

/** A linha dourada passa pelo sol em (930, 712). */
const LINHA_PRINCIPAL = 'M -60 800 C 260 760, 560 770, 930 712 S 1160 560, 1260 470'

export function FundoDoLogin() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_85%_0%,#24553a_0%,transparent_55%),linear-gradient(160deg,#10301c_0%,#0b2114_55%,#0a1a10_100%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(rgb(255_255_255/0.07)_1px,transparent_1.2px)] bg-size-[26px_26px]" />
      <svg className="absolute inset-0 size-full" viewBox="0 0 1200 900" preserveAspectRatio="xMidYMid slice">
        <defs>
          <radialGradient id="fundo-login-brilho">
            <stop offset="0%" stopColor="#d4a537" stopOpacity="0.38" />
            <stop offset="100%" stopColor="#d4a537" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="fundo-login-dourado" x1="0" x2="1">
            <stop offset="0%" stopColor="#d4a537" stopOpacity="0.15" />
            <stop offset="55%" stopColor="#e8c477" stopOpacity="0.75" />
            <stop offset="100%" stopColor="#d4a537" stopOpacity="0.5" />
          </linearGradient>
        </defs>

        <g fill="none" stroke="#a8d5b1" strokeWidth="1" className="fundo-login-leque">
          {Array.from({ length: LINHAS }, (_, i) => (
            <path key={i} d={curva(i)} strokeOpacity={0.09 + (i % 3) * 0.035} />
          ))}
        </g>

        <circle cx="930" cy="712" r="260" fill="url(#fundo-login-brilho)" />
        <path d={LINHA_PRINCIPAL} fill="none" stroke="url(#fundo-login-dourado)" strokeWidth="2" />
        <path d={LINHA_PRINCIPAL} pathLength={1000} fill="none" stroke="#f6e2b0" strokeWidth="3" strokeLinecap="round" className="fundo-login-cometa" />

        <circle cx="930" cy="712" r="34" fill="none" stroke="#e8c477" strokeOpacity="0.45" strokeWidth="2" className="fundo-login-pulso" />
        <circle cx="930" cy="712" r="22" fill="#d4a537" fillOpacity="0.16" stroke="#e8c477" strokeOpacity="0.6" strokeWidth="1.5" />
        <circle cx="930" cy="712" r="7" fill="#fbecc4" />
      </svg>
    </div>
  )
}

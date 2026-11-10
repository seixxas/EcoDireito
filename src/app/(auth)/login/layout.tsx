import type { ReactNode } from 'react'
import { BotaoTema } from '@/components/layout/botao-tema'
import { FundoDoLogin } from '@/components/marca/fundo-do-login'
import { Logo, Simbolo } from '@/components/marca/logo'
import { Icone, type NomeIcone } from '@/components/ui/icone'

const PONTOS: { icone: NomeIcone; texto: string }[] = [
  { icone: 'alarm', texto: 'Prazos da Secretaria do Verde' },
  { icone: 'newspaper', texto: 'Diário Oficial lido todo dia' },
  { icone: 'payments', texto: 'Financeiro por projeto' },
]

/** Raminho em traço fino, de enfeite nos cantos do painel branco. */
function Raminho({ className }: { className?: string }) {
  return (
    <svg aria-hidden viewBox="0 0 160 160" className={className} fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round">
      <path d="M10 150C40 120 70 80 120 20" />
      {[
        [30, 126, -1],
        [48, 104, 1],
        [64, 84, -1],
        [82, 62, 1],
        [98, 44, -1],
      ].map(([x, y, lado], i) => (
        <path key={i} d={`M${x} ${y}c${lado * 18} -4 ${lado * 30} -16 ${lado * 32} -34c${lado * -18} 2 ${lado * -30} 14 ${lado * -32} 34Z`} />
      ))}
      <path d="M120 20c6 -6 14 -8 22 -8c0 8 -3 16 -9 21c-6 4 -12 4 -13 -13Z" />
    </svg>
  )
}

/**
 * Login (10/11). À esquerda, a cena da floresta ao amanhecer (FundoDoLogin) com a marca e a frase; à direita, em branco,
 * só o formulário, com raminhos e curvas de nível bem leves nos cantos.
 */
export default function LayoutDoLogin({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-[#071a0f] p-2.5 lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(28rem,0.5fr)] lg:gap-2.5">
      <aside className="surgir relative hidden flex-col overflow-hidden rounded-2xl px-14 py-12 text-white lg:flex">
        <FundoDoLogin />
        <div className="relative flex items-center gap-3">
          <Simbolo claro className="size-10" />
          <span className="text-xl font-semibold tracking-tight">
            Eco <span className="text-brand-claro">Direito</span>
          </span>
          <span className="rounded-full border border-[#e8c477]/50 bg-black/15 px-2.5 py-0.5 text-xs font-medium text-[#e8c477] backdrop-blur-sm">Consultoria ambiental</span>
        </div>

        <div className="relative mt-[9vh] max-w-[36rem]">
          <p className="text-[3.25rem] font-bold leading-[1.08] tracking-[-0.03em] [text-shadow:0_2px_24px_rgb(0_0_0/0.35)]">
            Do protocolo ao TCA,
            <br />
            <span className="bg-[linear-gradient(90deg,#f6dc98,#d4a537)] bg-clip-text text-transparent">cada prazo em dia.</span>
          </p>
          <p className="mt-5 max-w-[30rem] text-[1.0625rem] leading-relaxed text-white/85">
            Os prazos de cada processo na Secretaria do Verde, o que saiu no Diário Oficial e o financeiro de cada projeto, num lugar só.
          </p>
          <ul className="mt-6 flex flex-wrap gap-2">
            {PONTOS.map(({ icone, texto }) => (
              <li key={texto} className="inline-flex items-center gap-2 rounded-full bg-white/8 px-3 py-1.5 text-sm font-medium ring-1 ring-white/15 backdrop-blur-md">
                <Icone nome={icone} className="text-base text-[#e8c477]" />
                {texto}
              </li>
            ))}
          </ul>
        </div>

        <p className="relative mt-auto text-xs text-white/60">Dados fictícios para demonstração · Sistema desenvolvido pela Awer</p>
      </aside>

      <main className="relative flex min-h-[calc(100vh-1.25rem)] flex-col overflow-hidden rounded-2xl bg-surface px-5 py-4 lg:px-10">
        <div aria-hidden className="relevo pointer-events-none absolute inset-0 opacity-35 [mask-image:radial-gradient(ellipse_at_100%_100%,black,transparent_60%)]" />
        <Raminho className="pointer-events-none absolute -bottom-4 -right-4 size-56 text-brand-500/15" />
        <Raminho className="pointer-events-none absolute -left-6 -top-6 size-40 rotate-180 text-brand-500/10" />

        <div className="relative flex items-center justify-between gap-2 lg:justify-end">
          <span className="lg:hidden">
            <Logo />
          </span>
          <BotaoTema />
        </div>
        <div className="surgir relative m-auto w-full max-w-[24rem] py-8">
          <Simbolo className="mb-5 hidden size-12 lg:block" />
          {children}
        </div>
        <p className="relative text-center text-xs text-muted">
          Acesso restrito a usuários autorizados<span className="lg:hidden"> · Dados fictícios para demonstração</span>
        </p>
      </main>
    </div>
  )
}

import type { ReactNode } from 'react'
import { BotaoTema } from '@/components/layout/botao-tema'
import { Logo, Simbolo } from '@/components/marca/logo'
import { CurvasDeNivel, FolhasCaindo } from '@/components/marca/natureza'

const PONTOS = ['Prazos da Secretaria do Verde', 'Diário Oficial lido todo dia', 'Financeiro por projeto']

/** Tela dividida: à esquerda o verde da marca (curvas de nível, folhas caindo, símbolo com reflexo); à direita, em claro, o formulário. */
export default function LayoutDoLogin({ children }: { children: ReactNode }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <aside className="copa surgir relative hidden flex-col justify-between overflow-hidden px-12 py-10 text-white lg:flex">
        <CurvasDeNivel />
        <FolhasCaindo />
        <div className="pointer-events-none absolute -right-48 -top-48 size-[34rem] rounded-full bg-[radial-gradient(circle,rgb(255_200_74_/_0.2),transparent_68%)]" aria-hidden />
        <span aria-hidden />
        <div className="relative max-w-[32rem]">
          <div className="mb-10 flex items-center gap-4">
            <Simbolo claro className="size-20" />
            <p className="leading-tight">
              <span className="block text-4xl font-bold tracking-tight">
                Eco <span className="text-brand-claro">Direito</span>
              </span>
              <span className="mt-1 block text-base font-medium text-white/80">Consultoria ambiental</span>
            </p>
          </div>
          <p className="text-4xl font-bold leading-tight tracking-tight">
            O licenciamento ambiental dos seus clientes, <span className="text-brand-claro">em dia.</span>
          </p>
          <ul className="mt-6 flex flex-wrap gap-2">
            {PONTOS.map((ponto) => (
              <li key={ponto} className="rounded-full border border-white/25 bg-white/10 px-3 py-1 text-sm backdrop-blur-sm">
                {ponto}
              </li>
            ))}
          </ul>
        </div>
        <p className="relative text-xs text-white/70">Dados fictícios para demonstração · Sistema desenvolvido pela Awer</p>
      </aside>

      <main className="lado-claro relative flex flex-col px-4 py-4 lg:px-10">
        <div className="flex items-center justify-between gap-2 lg:justify-end">
          <span className="lg:hidden">
            <Logo />
          </span>
          <BotaoTema />
        </div>
        <div className="surgir m-auto w-full max-w-[30rem] py-8">
          <div className="rounded-2xl bg-surface p-7 shadow-[0_24px_60px_-28px_rgb(18_61_23_/_0.35)] ring-1 ring-line sm:p-9">{children}</div>
          <p className="mt-4 text-center text-2xs font-medium text-warn lg:hidden">Dados fictícios para demonstração</p>
        </div>
      </main>
    </div>
  )
}

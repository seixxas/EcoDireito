import type { ReactNode } from 'react'
import { BotaoTema } from '@/components/layout/botao-tema'
import { FundoDoLogin } from '@/components/marca/fundo-do-login'
import { Logo, Simbolo } from '@/components/marca/logo'

/**
 * Login (10/11, a partir da tela do Ecoamper): dois painéis arredondados sobre o verde bem escuro.
 * À esquerda, a marca sobre o fundo animado (FundoDoLogin); à direita, em branco, só o formulário.
 */
export default function LayoutDoLogin({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-[#0a1a10] p-2.5 lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(28rem,0.5fr)] lg:gap-2.5">
      <aside className="surgir relative hidden flex-col overflow-hidden rounded-2xl px-14 py-12 text-white lg:flex">
        <FundoDoLogin />
        <div className="relative flex items-center gap-3">
          <Simbolo claro className="size-10" />
          <span className="text-xl font-semibold tracking-tight">
            Eco <span className="text-brand-claro">Direito</span>
          </span>
          <span className="rounded-full border border-[#e8c477]/50 px-2.5 py-0.5 text-xs font-medium text-[#e8c477]">Prazos e financeiro</span>
        </div>

        <div className="relative my-auto max-w-[36rem] py-10">
          <p className="text-[3.25rem] font-bold leading-[1.08] tracking-[-0.03em]">
            Do protocolo ao TCA,
            <br />
            <span className="text-[#e8c477]">cada prazo em dia.</span>
          </p>
          <p className="mt-5 max-w-[30rem] text-[1.0625rem] leading-relaxed text-white/85">
            Os prazos de cada processo na Secretaria do Verde, o que saiu no Diário Oficial e o financeiro de cada projeto, num lugar só.
          </p>
          <p className="mt-6 inline-flex items-center gap-2 rounded-lg bg-white/7 px-3 py-2 text-sm font-medium ring-1 ring-white/12 backdrop-blur-sm">
            <span className="size-2 rounded-full bg-[#4ade80] shadow-[0_0_8px_#4ade80]" />
            Diário Oficial lido todo dia
          </p>
        </div>

        <p className="relative text-xs text-white/55">Dados fictícios para demonstração · Sistema desenvolvido pela Awer</p>
      </aside>

      <main className="relative flex min-h-[calc(100vh-1.25rem)] flex-col rounded-2xl bg-surface px-5 py-4 lg:px-10">
        <div className="flex items-center justify-between gap-2 lg:justify-end">
          <span className="lg:hidden">
            <Logo />
          </span>
          <BotaoTema />
        </div>
        <div className="surgir m-auto w-full max-w-[24rem] py-8">{children}</div>
        <p className="text-center text-xs text-muted">
          Acesso restrito a usuários autorizados<span className="lg:hidden"> · Dados fictícios para demonstração</span>
        </p>
      </main>
    </div>
  )
}

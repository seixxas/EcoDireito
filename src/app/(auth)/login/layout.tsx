import type { ReactNode } from 'react'
import { BotaoTema } from '@/components/layout/botao-tema'

/** Faixa verde à esquerda e formulário à direita. Em tela estreita, só o formulário com a marca em cima. */
export default function LayoutDoLogin({ children }: { children: ReactNode }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
      <aside className="hidden flex-col justify-between bg-brand-700 px-14 py-16 text-[1.25rem] text-on-brand lg:flex dark:bg-brand-100 dark:text-ink">
        <p className="font-semibold leading-snug">
          Eco Direito
          <small className="block text-[1.375rem] font-medium opacity-85">Consultoria ambiental</small>
        </p>
        <div>
          <p className="max-w-[30ch]">Projetos de licenciamento, prazos, Diário Oficial e financeiro em um só lugar.</p>
          <p className="font-medium">Dados fictícios para demonstração</p>
        </div>
      </aside>
      <main className="relative flex flex-col px-4 py-4 lg:px-12">
        <div className="flex flex-wrap items-center justify-between gap-3 lg:absolute lg:right-6 lg:top-6">
          <p className="leading-tight lg:hidden">
            <span className="block text-xl font-semibold text-brand-700">Eco Direito</span>
            <span className="mt-1 block text-2xs font-medium text-subtle">Consultoria ambiental</span>
          </p>
          <BotaoTema />
        </div>
        <div className="m-auto w-full max-w-130 py-8 lg:py-16">
          {children}
          <p className="mt-6 text-2xs font-medium text-warn lg:hidden">Dados fictícios para demonstração</p>
        </div>
      </main>
    </div>
  )
}

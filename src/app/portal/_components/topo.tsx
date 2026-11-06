import type { ReactNode } from 'react'
import { sair } from '@/app/(auth)/actions'
import { BotaoTema } from '@/components/layout/botao-tema'
import { Botao } from '@/components/ui/form'

/** Barra do portal do cliente e a coluna da página. `comSair` só para o cliente (a equipe vê o portal para conferir). */
export function PaginaDoPortal({ comSair, children }: { comSair: boolean; children: ReactNode }) {
  return (
    <>
      <header className="border-b border-line bg-rail">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-8 sm:py-4">
          <p className="leading-tight">
            <span className="block text-xl font-semibold text-brand-700">Eco Direito</span>
            <span className="block text-2xs font-medium text-subtle">Portal do cliente</span>
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <BotaoTema />
            {comSair && (
              <form action={sair}>
                <Botao variante="secundario">Sair</Botao>
              </form>
            )}
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 pb-16 pt-7 text-[1.25rem] sm:px-8 sm:pb-24 sm:pt-12">{children}</main>
    </>
  )
}

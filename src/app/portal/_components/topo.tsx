import type { ReactNode } from 'react'
import { sair } from '@/app/(auth)/actions'
import { BotaoTema } from '@/components/layout/botao-tema'
import { Logo } from '@/components/marca/logo'
import { CurvasDeNivel } from '@/components/marca/natureza'
import { Botao } from '@/components/ui/form'

/** Barra do portal do cliente e a coluna da página. `comSair` só para o cliente (a equipe vê o portal para conferir). */
export function PaginaDoPortal({ comSair, children }: { comSair: boolean; children: ReactNode }) {
  return (
    <div className="relevo min-h-dvh">
      {/* Topo na copa, com as curvas de nível do login: o cliente reconhece a marca da Eco Direito. */}
      <header className="copa relative overflow-hidden">
        <CurvasDeNivel />
        <div className="relative mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2 px-3 py-2.5 sm:px-5 sm:py-3">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <Logo claro legenda={false} />
            <span className="border-l border-white/30 pl-3 text-sm font-medium text-white/80">Portal do cliente</span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <BotaoTema />
            {comSair && (
              <form action={sair}>
                <Botao variante="secundario">Sair</Botao>
              </form>
            )}
          </div>
        </div>
      </header>
      <main className="surgir mx-auto max-w-6xl px-3 pb-10 pt-4 sm:px-5 sm:pb-12 sm:pt-6">{children}</main>
    </div>
  )
}

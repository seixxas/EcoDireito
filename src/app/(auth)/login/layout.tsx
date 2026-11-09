import type { ReactNode } from 'react'
import { BotaoTema } from '@/components/layout/botao-tema'
import { Logo, Simbolo } from '@/components/marca/logo'
import { CurvasDeNivel, FolhasCaindo } from '@/components/marca/natureza'

const PONTOS = ['Prazos da Secretaria do Verde', 'Diário Oficial lido todo dia', 'Financeiro por projeto']

/** Fundo verde com curvas de nível e folhas caindo; à esquerda a marca com reflexo, à direita o formulário num cartão de vidro. */
export default function LayoutDoLogin({ children }: { children: ReactNode }) {
  return (
    <div className="copa relative grid min-h-screen overflow-hidden lg:grid-cols-[minmax(0,6fr)_minmax(0,5fr)]">
      <CurvasDeNivel />
      <FolhasCaindo />
      <div className="pointer-events-none absolute -right-32 -top-40 size-[34rem] rounded-full bg-[#ffc84a] opacity-[0.13] blur-3xl" aria-hidden />

      <aside className="surgir relative hidden flex-col justify-between px-12 py-10 text-white lg:flex">
        <Logo claro />
        <div className="max-w-[34rem]">
          <Simbolo className="reflexo mb-10 size-20 drop-shadow-[0_10px_24px_rgb(0_0_0_/_0.25)]" />
          <p className="text-4xl font-bold leading-tight tracking-tight">
            O licenciamento ambiental dos seus clientes, <span className="text-[#bfe6c4]">em dia.</span>
          </p>
          <ul className="mt-6 flex flex-wrap gap-2">
            {PONTOS.map((ponto) => (
              <li key={ponto} className="rounded-full border border-white/25 bg-white/10 px-3 py-1 text-sm backdrop-blur-sm">
                {ponto}
              </li>
            ))}
          </ul>
        </div>
        <p className="text-xs text-white/70">Dados fictícios para demonstração · Sistema desenvolvido pela Awer</p>
      </aside>

      <main className="relative flex flex-col px-4 py-4 lg:px-10">
        <div className="flex items-center justify-between gap-2 lg:justify-end">
          <span className="lg:hidden">
            <Logo claro />
          </span>
          <BotaoTema />
        </div>
        <div className="surgir m-auto w-full max-w-[26rem] py-6">
          <div className="vidro brilho rounded-2xl p-6 sm:p-7">{children}</div>
          <p className="mt-4 text-center text-2xs font-medium text-white/80 lg:hidden">Dados fictícios para demonstração</p>
        </div>
      </main>
    </div>
  )
}

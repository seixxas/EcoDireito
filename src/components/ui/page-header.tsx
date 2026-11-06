import type { ReactNode } from 'react'
import { LinkRapido } from './link-rapido'

/** Topo da página: título grande, a frase que responde a pergunta da tela e a ação principal. `voltar` leva à tela de cima. */
export function PageHeader({ titulo, resumo, acoes, voltar }: { titulo: string; resumo?: ReactNode; acoes?: ReactNode; voltar?: { href: string; rotulo: string } }) {
  return (
    <header className="mb-7">
      {voltar && (
        <LinkRapido href={voltar.href} className="link inline-flex min-h-12 items-center text-sm">
          ← {voltar.rotulo}
        </LinkRapido>
      )}
      <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3 border-b border-line pb-6">
        <div className="min-w-0">
          <h1 className="text-3xl font-semibold tracking-[-0.01em] text-ink lg:text-4xl">{titulo}</h1>
          {resumo && <div className="mt-2 max-w-[70ch] text-[1.25rem] text-muted">{resumo}</div>}
        </div>
        {acoes && <div className="flex flex-wrap items-center gap-3">{acoes}</div>}
      </div>
    </header>
  )
}

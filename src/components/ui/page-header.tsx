import type { ReactNode } from 'react'
import { LinkRapido } from './link-rapido'

/** Topo da página: título, a frase que responde a pergunta da tela e a ação principal. `voltar` leva à tela de cima. */
export function PageHeader({ titulo, resumo, acoes, voltar }: { titulo: string; resumo?: ReactNode; acoes?: ReactNode; voltar?: { href: string; rotulo: string } }) {
  return (
    <header className="mb-4">
      {voltar && (
        <LinkRapido href={voltar.href} className="link mb-1 inline-block text-sm">
          ← {voltar.rotulo}
        </LinkRapido>
      )}
      <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-2">
        <div className="min-w-0 flex-1 basis-[28rem]">
          <span className="copa mb-2 block h-1 w-10 rounded-full" aria-hidden />
          <h1 className="text-3xl font-semibold tracking-tight text-ink lg:text-4xl">{titulo}</h1>
          {resumo && <div className="mt-0.5 max-w-[80ch] text-muted">{resumo}</div>}
        </div>
        {acoes && <div className="flex flex-wrap items-center gap-2">{acoes}</div>}
      </div>
    </header>
  )
}

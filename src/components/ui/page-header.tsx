import type { ReactNode } from 'react'

/** Topo da página. `resumo` é a frase que responde a pergunta da tela ("1 prazo vencido e 8 nesta semana"). */
export function PageHeader({ titulo, resumo, acoes }: { titulo: string; resumo?: ReactNode; acoes?: ReactNode }) {
  return (
    <header className="mb-6 flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
      <div className="min-w-0">
        <h1 className="font-display text-[1.75rem] font-semibold leading-tight tracking-tight text-ink">{titulo}</h1>
        {resumo && <p className="mt-1 text-muted">{resumo}</p>}
      </div>
      {acoes && <div className="flex shrink-0 flex-wrap items-center gap-2">{acoes}</div>}
    </header>
  )
}

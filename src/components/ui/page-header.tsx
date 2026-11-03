import type { ReactNode } from 'react'

export function PageHeader({ titulo, descricao, acoes }: { titulo: string; descricao?: ReactNode; acoes?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="font-display text-2xl font-semibold text-brand-900 lg:text-3xl">{titulo}</h1>
        {descricao && <p className="mt-1 max-w-3xl text-sm text-muted">{descricao}</p>}
      </div>
      {acoes}
    </div>
  )
}

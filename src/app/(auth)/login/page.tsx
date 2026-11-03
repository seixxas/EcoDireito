import { Leaf } from 'lucide-react'
import type { Metadata } from 'next'
import { FormularioLogin } from './_components/formulario-login'

export const metadata: Metadata = { title: 'Entrar' }

export default async function PaginaLogin({ searchParams }: { searchParams: Promise<{ voltar?: string }> }) {
  const { voltar } = await searchParams
  return (
    <main className="flex min-h-screen items-center justify-center bg-canvas px-4">
      <div className="w-full max-w-sm">
        <div className="mb-10 flex items-center gap-2">
          <span className="flex size-8 items-center justify-center rounded-md bg-brand-700 text-white">
            <Leaf className="size-4" />
          </span>
          <span className="font-display text-xl font-semibold text-ink">Eco Direito</span>
        </div>
        <h1 className="font-display text-[1.75rem] font-semibold leading-tight text-ink">Entrar</h1>
        <p className="mb-6 mt-1 text-muted">Prazos dos processos e financeiro do escritório.</p>
        <div className="rounded-lg border border-line bg-surface p-5">
          <FormularioLogin voltar={voltar} />
        </div>
        <p className="mt-6 text-xs text-subtle">Sistema desenvolvido pela Awer</p>
      </div>
    </main>
  )
}

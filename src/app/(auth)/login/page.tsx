import { Leaf } from 'lucide-react'
import type { Metadata } from 'next'
import { FormularioLogin } from './_components/formulario-login'

export const metadata: Metadata = { title: 'Entrar' }

export default async function PaginaLogin({ searchParams }: { searchParams: Promise<{ voltar?: string }> }) {
  const { voltar } = await searchParams
  return (
    <main className="flex min-h-screen items-center justify-center bg-brand-900 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex items-center justify-center gap-2.5 text-white">
          <span className="flex size-10 items-center justify-center rounded-xl bg-brand-500">
            <Leaf className="size-5" />
          </span>
          <span className="leading-none">
            <span className="block font-display text-xl font-semibold">eco direito</span>
            <span className="block text-[10px] font-semibold uppercase tracking-[0.18em] text-brand-300">ambiental</span>
          </span>
        </div>
        <div className="rounded-2xl bg-surface p-6 shadow-xl">
          <h1 className="font-display text-xl font-semibold text-brand-900">Entrar</h1>
          <p className="mb-5 mt-1 text-sm text-muted">Prazos e financeiro da Eco Direito.</p>
          <FormularioLogin voltar={voltar} />
        </div>
        <p className="mt-4 text-center text-xs text-brand-300">Sistema desenvolvido pela Awer</p>
      </div>
    </main>
  )
}

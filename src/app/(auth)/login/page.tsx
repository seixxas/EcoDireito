import type { Metadata } from 'next'
import { Icone } from '@/components/ui/icone'
import { FormularioLogin } from './_components/formulario-login'

export const metadata: Metadata = { title: 'Entrar' }

export default async function PaginaLogin({ searchParams }: { searchParams: Promise<{ voltar?: string }> }) {
  const { voltar } = await searchParams
  return (
    <>
      <h1 className="mb-6 text-3xl font-bold tracking-tight text-ink">Entrar</h1>
      <FormularioLogin voltar={voltar} />
      <p className="mt-6 flex items-start gap-3 rounded-xl px-4 py-3 text-sm text-muted ring-1 ring-line">
        <span className="inline-flex size-7 shrink-0 items-center justify-center rounded-lg bg-accent/15 text-accent">
          <Icone nome="call" className="text-base" />
        </span>
        <span>
          <b className="font-semibold text-ink">Problemas para entrar?</b> Fale com uma das sócias.
        </span>
      </p>
    </>
  )
}

import type { Metadata } from 'next'
import { FormularioLogin } from './_components/formulario-login'

export const metadata: Metadata = { title: 'Entrar' }

export default async function PaginaLogin({ searchParams }: { searchParams: Promise<{ voltar?: string }> }) {
  const { voltar } = await searchParams
  return (
    <>
      <h1 className="mb-5 text-3xl font-bold tracking-tight">Entrar</h1>
      <FormularioLogin voltar={voltar} />
      <p className="mt-5 border-t border-line pt-3 text-xs text-muted">Problemas para entrar? Fale com uma das sócias.</p>
    </>
  )
}

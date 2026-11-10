import type { Metadata } from 'next'
import { FormularioLogin } from './_components/formulario-login'

export const metadata: Metadata = { title: 'Entrar' }

export default async function PaginaLogin({ searchParams }: { searchParams: Promise<{ voltar?: string }> }) {
  const { voltar } = await searchParams
  return (
    <>
      <h1 className="text-3xl font-bold tracking-tight">Bom te ver de novo</h1>
      <p className="mb-5 mt-1 text-sm text-muted">Entre com o e-mail e a senha que você recebeu da Eco Direito.</p>
      <FormularioLogin voltar={voltar} />
      <p className="mt-5 border-t border-line pt-3 text-xs text-muted">Problemas para entrar? Fale com uma das sócias.</p>
    </>
  )
}

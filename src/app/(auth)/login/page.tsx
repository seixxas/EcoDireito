import type { Metadata } from 'next'
import { FormularioLogin } from './_components/formulario-login'

export const metadata: Metadata = { title: 'Entrar' }

export default async function PaginaLogin({ searchParams }: { searchParams: Promise<{ voltar?: string }> }) {
  const { voltar } = await searchParams
  return (
    <>
      <h1 className="text-3xl font-semibold lg:text-[3.25rem]">Entrar</h1>
      <p className="mb-9 mt-2 text-[1.25rem] text-muted">Use o e-mail e a senha que você recebeu da Eco Direito.</p>
      <FormularioLogin voltar={voltar} />
      <p className="mt-7 text-sm text-muted">Problemas para entrar? Fale com uma das sócias.</p>
      <p className="mt-6 text-xs text-subtle">Sistema desenvolvido pela Awer</p>
    </>
  )
}

import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { listarProcessos } from '@/data/processos'
import { exigirUsuario } from '@/data/sessao'

export const metadata: Metadata = { title: 'Seus processos' }

/** Entrada do cliente: com um processo, vai direto para ele; com vários, escolhe. */
export default async function PortalInicio() {
  const usuario = await exigirUsuario()
  if (usuario.papel !== 'cliente') redirect('/processos')
  const processos = (await listarProcessos()).filter(({ processo }) => processo.clienteId === usuario.clienteId)
  if (processos.length === 1) redirect(`/portal/${processos[0].processo.id}`)

  return (
    <main className="mx-auto max-w-2xl px-5 py-12">
      <h1 className="font-display text-2xl font-semibold text-brand-900">Seus processos</h1>
      <ul className="mt-6 space-y-3">
        {processos.map(({ processo }) => (
          <li key={processo.id}>
            <Link href={`/portal/${processo.id}`} className="block rounded-xl border border-line bg-surface p-4 hover:border-brand-300">
              <p className="font-semibold text-brand-700">{processo.empreendimento}</p>
              <p className="text-sm text-muted">{processo.endereco}</p>
            </Link>
          </li>
        ))}
      </ul>
      {processos.length === 0 && <p className="mt-6 text-muted">Nenhum processo ligado à sua conta. Fale com a Eco Direito.</p>}
    </main>
  )
}

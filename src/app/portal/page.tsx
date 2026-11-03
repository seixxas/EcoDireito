import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { Linha, Lista } from '@/components/ui/lista'
import { listarProcessos } from '@/data/processos'
import { exigirUsuario } from '@/data/sessao'
import { TopoDoPortal } from './_components/topo'

export const metadata: Metadata = { title: 'Seus processos' }

/** Entrada do cliente: com um processo, vai direto para ele; com vários, escolhe. */
export default async function PortalInicio() {
  const usuario = await exigirUsuario()
  if (usuario.papel !== 'cliente') redirect('/processos')
  const processos = (await listarProcessos()).filter(({ processo }) => processo.clienteId === usuario.clienteId)
  if (processos.length === 1) redirect(`/portal/${processos[0].processo.id}`)

  return (
    <>
      <TopoDoPortal comSair />
      <main className="mx-auto max-w-3xl px-5 py-10">
        <h1 className="font-display text-[1.75rem] font-semibold leading-tight text-ink">Seus processos</h1>
        <p className="mb-6 mt-1 text-muted">Escolha o empreendimento para ver a fase e o próximo prazo.</p>
        {processos.length ? (
          <Lista>
            {processos.map(({ processo }) => (
              <Linha key={processo.id} href={`/portal/${processo.id}`}>
                <span>
                  <span className="block font-medium text-ink">{processo.empreendimento}</span>
                  <span className="block text-xs text-muted">{processo.endereco}</span>
                </span>
              </Linha>
            ))}
          </Lista>
        ) : (
          <p className="text-muted">Nenhum processo ligado à sua conta. Fale com a Eco Direito.</p>
        )}
      </main>
    </>
  )
}

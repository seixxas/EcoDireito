import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { Vazio } from '@/components/ui/expansivel'
import { Linha, Lista } from '@/components/ui/lista'
import { PageHeader } from '@/components/ui/page-header'
import { listarProcessos } from '@/data/processos'
import { exigirUsuario } from '@/data/sessao'
import { PaginaDoPortal } from './_components/topo'

export const metadata: Metadata = { title: 'Seus projetos' }

/** Entrada do cliente: com um processo, vai direto para ele; com vários, escolhe. */
export default async function PortalInicio() {
  const usuario = await exigirUsuario()
  if (usuario.papel !== 'cliente') redirect('/projetos')
  const processos = (await listarProcessos()).filter(({ processo }) => processo.clienteId === usuario.clienteId)
  if (processos.length === 1) redirect(`/portal/${processos[0].processo.id}`)

  return (
    <PaginaDoPortal comSair>
      <PageHeader titulo="Seus projetos" resumo="Escolha o empreendimento para ver a fase e o próximo prazo." />
      {processos.length ? (
        <Lista>
          {processos.map(({ processo }) => (
            <Linha key={processo.id} href={`/portal/${processo.id}`}>
              <span className="min-w-0 flex-1 basis-60">
                <span className="block text-sm font-semibold leading-snug">{processo.empreendimento}</span>
                <span className="block text-xs text-muted">{processo.endereco}</span>
              </span>
            </Linha>
          ))}
        </Lista>
      ) : (
        <Vazio>Nenhum projeto ligado à sua conta. Fale com a Eco Direito.</Vazio>
      )}
    </PaginaDoPortal>
  )
}

import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { PageHeader } from '@/components/ui/page-header'
import { obterCliente } from '@/data/processos'
import { exigirArea } from '@/data/sessao'
import { FormularioCliente } from '../../_components/formulario-cliente'

export const metadata: Metadata = { title: 'Editar cliente' }

export default async function PaginaEditarCliente({ params }: { params: Promise<{ id: string }> }) {
  await exigirArea('prazos', 'editar')
  const { id } = await params
  const cliente = await obterCliente(id)
  if (!cliente) notFound()

  return (
    <div className="max-w-[55rem]">
      <PageHeader voltar={{ href: '/projetos/clientes', rotulo: 'Voltar para Clientes' }} titulo={cliente.nome} />
      <FormularioCliente cliente={cliente} />
    </div>
  )
}

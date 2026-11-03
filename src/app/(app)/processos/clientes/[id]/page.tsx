import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { PageHeader } from '@/components/ui/page-header'
import { obterCliente } from '@/data/processos'
import { exigirArea } from '@/data/sessao'
import { FormularioCliente } from '../../_components/formulario-cliente'
import { LinkVoltar } from '../../_components/link-voltar'

export const metadata: Metadata = { title: 'Editar cliente' }

export default async function PaginaEditarCliente({ params }: { params: Promise<{ id: string }> }) {
  await exigirArea('prazos', 'editar')
  const { id } = await params
  const cliente = await obterCliente(id)
  if (!cliente) notFound()

  return (
    <>
      <LinkVoltar href="/processos/clientes">Clientes</LinkVoltar>
      <PageHeader titulo={cliente.nome} />
      <Card>
        <FormularioCliente cliente={cliente} />
      </Card>
    </>
  )
}

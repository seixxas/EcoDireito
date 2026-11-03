import type { Metadata } from 'next'
import { Card } from '@/components/ui/card'
import { PageHeader } from '@/components/ui/page-header'
import { exigirArea } from '@/data/sessao'
import { FormularioCliente } from '../../_components/formulario-cliente'
import { LinkVoltar } from '../../_components/link-voltar'

export const metadata: Metadata = { title: 'Novo cliente' }

/** `?voltar=/processos/novo` devolve para o cadastro de processo depois de salvar. */
export default async function PaginaNovoCliente({ searchParams }: { searchParams: Promise<{ voltar?: string }> }) {
  await exigirArea('prazos', 'editar')
  const { voltar } = await searchParams

  return (
    <>
      <LinkVoltar href="/processos/clientes">Clientes</LinkVoltar>
      <PageHeader titulo="Novo cliente" />
      <Card>
        <FormularioCliente voltar={voltar} />
      </Card>
    </>
  )
}

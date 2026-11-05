import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { PageHeader } from '@/components/ui/page-header'
import { listarClientes, obterProcesso } from '@/data/processos'
import { exigirArea } from '@/data/sessao'
import { FormularioProcesso } from '../../_components/formulario-processo'
import { LinkVoltar } from '../../_components/link-voltar'

export const metadata: Metadata = { title: 'Editar projeto' }

export default async function PaginaEditarProcesso({ params }: { params: Promise<{ id: string }> }) {
  await exigirArea('prazos', 'editar')
  const { id } = await params
  const [dados, clientes] = await Promise.all([obterProcesso(id), listarClientes()])
  if (!dados) notFound()
  const { eventos, ...processo } = dados.processo

  return (
    <>
      <LinkVoltar href={`/projetos/${id}`}>{processo.empreendimento}</LinkVoltar>
      <PageHeader titulo="Editar projeto" resumo={`Os ${eventos.length} eventos não mudam aqui: use a linha do tempo do projeto.`} />
      <Card>
        <FormularioProcesso clientes={clientes.map(({ cliente }) => ({ id: cliente.id, nome: cliente.nome }))} valores={processo} />
      </Card>
    </>
  )
}

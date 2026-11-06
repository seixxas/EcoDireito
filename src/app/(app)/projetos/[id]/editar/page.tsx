import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { PageHeader } from '@/components/ui/page-header'
import { listarClientes, obterProcesso } from '@/data/processos'
import { exigirArea } from '@/data/sessao'
import { FormularioProcesso } from '../../_components/formulario-processo'

export const metadata: Metadata = { title: 'Editar projeto' }

export default async function PaginaEditarProcesso({ params }: { params: Promise<{ id: string }> }) {
  await exigirArea('prazos', 'editar')
  const { id } = await params
  const [dados, clientes] = await Promise.all([obterProcesso(id), listarClientes()])
  if (!dados) notFound()
  const { eventos, ...processo } = dados.processo

  return (
    <div className="max-w-[55rem]">
      <PageHeader
        voltar={{ href: `/projetos/${id}`, rotulo: `Voltar para ${processo.empreendimento}` }}
        titulo="Editar projeto"
        resumo={`Os ${eventos.length} eventos não mudam aqui: use a linha do tempo do projeto.`}
      />
      <FormularioProcesso clientes={clientes.map(({ cliente }) => ({ id: cliente.id, nome: cliente.nome }))} valores={processo} cancelar={`/projetos/${id}`} />
    </div>
  )
}

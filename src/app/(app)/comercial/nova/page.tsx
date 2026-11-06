import type { Metadata } from 'next'
import { PageHeader } from '@/components/ui/page-header'
import { listarClientes } from '@/data/processos'
import { exigirArea } from '@/data/sessao'
import { FormularioProposta } from '../_components/formulario-proposta'

export const metadata: Metadata = { title: 'Nova proposta' }

/** Começo de todo processo: a proposta nasce na fase 1, sem nº SEI. `?cliente=` vem do cadastro de cliente novo. */
export default async function PaginaNovaProposta({ searchParams }: { searchParams: Promise<{ cliente?: string }> }) {
  await exigirArea('comercial', 'editar')
  const [{ cliente }, clientes] = await Promise.all([searchParams, listarClientes()])

  return (
    <div className="max-w-6xl">
      <PageHeader titulo="Nova proposta" resumo="Preencha os 3 passos. A proposta fica “Em elaboração” até você enviar ao cliente." voltar={{ href: '/comercial', rotulo: 'Voltar para Propostas' }} />
      <FormularioProposta clientes={clientes.map(({ cliente: c }) => ({ id: c.id, nome: c.nome }))} clienteId={cliente} />
    </div>
  )
}

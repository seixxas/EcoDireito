import type { Metadata } from 'next'
import { LinkRapido } from '@/components/ui/link-rapido'
import { Card } from '@/components/ui/card'
import { classeBotao } from '@/components/ui/form'
import { PageHeader } from '@/components/ui/page-header'
import { listarClientes } from '@/data/processos'
import { exigirArea } from '@/data/sessao'
import { LinkVoltar } from '../../projetos/_components/link-voltar'
import { FormularioProposta } from '../_components/formulario-proposta'

export const metadata: Metadata = { title: 'Nova proposta' }

/** Começo de todo processo: a proposta nasce na fase 1, sem nº SEI. `?cliente=` vem do cadastro de cliente novo. */
export default async function PaginaNovaProposta({ searchParams }: { searchParams: Promise<{ cliente?: string }> }) {
  await exigirArea('comercial', 'editar')
  const [{ cliente }, clientes] = await Promise.all([searchParams, listarClientes()])

  return (
    <>
      <LinkVoltar href="/comercial">Comercial</LinkVoltar>
      <PageHeader
        titulo="Nova proposta"
        resumo="Cria o projeto na fase Proposta. Depois é marcar quando foi enviada e quando o cliente aprovou."
        acoes={
          <LinkRapido href={`/projetos/clientes/novo?voltar=${encodeURIComponent('/comercial/nova')}`} className={classeBotao('secundario')}>
            Cliente novo
          </LinkRapido>
        }
      />
      <Card>
        <FormularioProposta clientes={clientes.map(({ cliente: c }) => ({ id: c.id, nome: c.nome }))} clienteId={cliente} />
      </Card>
    </>
  )
}

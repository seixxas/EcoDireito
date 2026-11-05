import type { Metadata } from 'next'
import { Card } from '@/components/ui/card'
import { PageHeader } from '@/components/ui/page-header'
import { exigirArea } from '@/data/sessao'
import { caminhoInterno } from '@/lib/permissoes'
import { FormularioCliente } from '../../_components/formulario-cliente'
import { LinkVoltar } from '../../_components/link-voltar'

export const metadata: Metadata = { title: 'Novo cliente' }

/** De onde a pessoa veio, para a seta de voltar dizer para onde vai. */
function rotuloDaVolta(voltar: string) {
  if (voltar.startsWith('/comercial/nova')) return 'Voltar para a proposta'
  if (voltar.startsWith('/projetos/novo')) return 'Voltar para o novo projeto'
  return 'Voltar'
}

/** `?voltar=/comercial/nova` devolve para a proposta (ou o cadastro de processo) depois de salvar, com o cliente novo já escolhido. */
export default async function PaginaNovoCliente({ searchParams }: { searchParams: Promise<{ voltar?: string }> }) {
  await exigirArea('prazos', 'editar')
  const { voltar: pedido } = await searchParams
  const voltar = pedido && caminhoInterno(pedido) ? pedido : undefined

  return (
    <>
      {voltar ? <LinkVoltar href={voltar}>{rotuloDaVolta(voltar)}</LinkVoltar> : <LinkVoltar href="/projetos/clientes">Clientes</LinkVoltar>}
      <PageHeader titulo="Novo cliente" resumo={voltar ? 'Ao salvar, você volta para onde estava, com este cliente já escolhido.' : undefined} />
      <Card>
        <FormularioCliente voltar={voltar} />
      </Card>
    </>
  )
}

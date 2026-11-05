import { ArrowLeft } from 'lucide-react'
import type { Metadata } from 'next'
import { LinkRapido } from '@/components/ui/link-rapido'
import { notFound } from 'next/navigation'
import { SituacaoDaNota } from '@/components/financeiro/situacao-nota'
import { PageHeader } from '@/components/ui/page-header'
import { obterNota } from '@/data/financeiro'
import { exigirArea } from '@/data/sessao'
import { situacaoNota } from '@/domain/financeiro/notas'
import { pode } from '@/lib/permissoes'
import { DetalheDaNota } from '../../_components/detalhe-da-nota'

export const metadata: Metadata = { title: 'Nota fiscal' }

export default async function PaginaNota({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const [usuario, dados] = await Promise.all([exigirArea('financeiro'), obterNota(id)])
  if (!dados) notFound()
  const { hoje: dia, nota, cliente } = dados

  return (
    <>
      <LinkRapido href="/financeiro" className="mb-3 inline-flex items-center gap-1 text-sm text-muted hover:text-ink">
        <ArrowLeft className="size-4" /> Faturamento
      </LinkRapido>
      <PageHeader
        titulo={`NF ${nota.numero}`}
        resumo={
          <span className="inline-flex flex-wrap items-center gap-x-3 gap-y-1">
            {cliente.nome} <SituacaoDaNota situacao={situacaoNota(nota, dia)} />
          </span>
        }
      />
      <DetalheDaNota dados={dados} editar={pode(usuario.papel, 'financeiro', 'editar')} />
    </>
  )
}

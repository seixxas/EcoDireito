import { ArrowLeft, Trash2 } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Badge, type Tom } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { classeBotao } from '@/components/ui/form'
import { PageHeader } from '@/components/ui/page-header'
import { listarContratos } from '@/data/financeiro'
import { exigirArea } from '@/data/sessao'
import type { SituacaoParcela } from '@/domain/financeiro/parcelas'
import { somar } from '@/lib/dinheiro'
import { brl, formatarData } from '@/lib/formatar'
import { excluirParcela } from '../actions'
import { FormularioParcela } from './_components/formulario-parcela'

export const metadata: Metadata = { title: 'Contrato' }

const SITUACAO: Record<SituacaoParcela, { rotulo: string; tom: Tom }> = {
  aguardando: { rotulo: 'Aguardando o evento', tom: 'neutral' },
  liberada: { rotulo: 'Pronta para faturar', tom: 'warn' },
  faturada: { rotulo: 'Faturada', tom: 'info' },
  recebida: { rotulo: 'Recebida', tom: 'ok' },
}

export default async function PaginaContrato({ params }: { params: Promise<{ processoId: string }> }) {
  const [{ processoId }, contratos] = await Promise.all([params, listarContratos(), exigirArea('financeiro', 'editar')])
  const contrato = contratos.find((c) => c.processo.id === processoId)
  if (!contrato) notFound()
  const { processo, cliente, parcelas } = contrato

  return (
    <>
      <Link href="/financeiro/contratos" className="mb-3 inline-flex items-center gap-1 text-sm text-muted hover:text-ink">
        <ArrowLeft className="size-4" /> Contratos
      </Link>
      <PageHeader
        titulo={processo.empreendimento}
        descricao={`${cliente.nome} · contrato de ${brl(somar(parcelas.map((p) => p.parcela.valor)))}`}
        acoes={
          <Link href={`/processos/${processo.id}`} className={classeBotao('secundario')}>
            Ver processo
          </Link>
        }
      />

      <Card titulo="Parcelas" className="mb-6" flush>
        <ul className="divide-y divide-line">
          {parcelas.map(({ parcela, situacao, nota, liberadaEm }) => (
            <li key={parcela.id} className="flex flex-col gap-3 px-5 py-4 lg:flex-row lg:items-start">
              <FormularioParcela processoId={processo.id} parcela={parcela} />
              <div className="flex items-center gap-2 lg:w-60 lg:justify-end lg:pt-7">
                <Badge tom={SITUACAO[situacao].tom}>{SITUACAO[situacao].rotulo}</Badge>
                {situacao === 'liberada' && (
                  <Link href={`/financeiro/notas/nova?parcela=${parcela.id}`} className="text-sm font-medium text-brand-700 hover:underline" title={`Liberada em ${formatarData(liberadaEm!)}`}>
                    Registrar nota
                  </Link>
                )}
                {nota ? (
                  <Link href={`/financeiro/notas/${nota.id}`} className="text-sm text-brand-700 hover:underline">
                    NF {nota.numero}
                  </Link>
                ) : (
                  <form action={excluirParcela}>
                    <input type="hidden" name="id" value={parcela.id} />
                    <button title="Apagar parcela" className="rounded-lg p-2 text-subtle hover:bg-danger-soft hover:text-danger">
                      <Trash2 className="size-4" />
                    </button>
                  </form>
                )}
              </div>
            </li>
          ))}
          {parcelas.length === 0 && <li className="px-5 py-8 text-center text-muted">Este processo ainda não tem parcelas.</li>}
        </ul>
      </Card>

      <Card titulo="Nova parcela">
        <FormularioParcela processoId={processo.id} />
        <p className="mt-3 text-xs text-subtle">Licenciamento costuma ter 3 parcelas (aceite da proposta, LAA e TCA); manejo, 50% na entrada e 50% no fim do corte.</p>
      </Card>
    </>
  )
}

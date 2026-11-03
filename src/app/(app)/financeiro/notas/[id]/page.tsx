import { ArrowLeft } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { ReactNode } from 'react'
import { SituacaoNotaBadge } from '@/components/financeiro/situacao-nota'
import { Card } from '@/components/ui/card'
import { PageHeader } from '@/components/ui/page-header'
import { obterNota } from '@/data/financeiro'
import { exigirArea } from '@/data/sessao'
import { motivoParaNaoCancelar, situacaoNota, valorLiquido } from '@/domain/financeiro/notas'
import { nomeDaConta } from '@/domain/financeiro/plano-de-contas'
import { brl, formatarData } from '@/lib/formatar'
import { pode } from '@/lib/permissoes'
import { BotaoCancelarNota } from './_components/botao-cancelar-nota'
import { FormularioRecebimento } from './_components/formulario-recebimento'

export const metadata: Metadata = { title: 'Nota fiscal' }

function Dado({ rotulo, children }: { rotulo: string; children: ReactNode }) {
  return (
    <div>
      <dt className="text-xs text-muted">{rotulo}</dt>
      <dd className="mt-0.5 text-sm text-ink">{children}</dd>
    </div>
  )
}

export default async function PaginaNota({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const [usuario, dados] = await Promise.all([exigirArea('financeiro'), obterNota(id)])
  if (!dados) notFound()
  const { hoje: dia, nota, cliente, processo, parcela, lancamentos } = dados
  const editar = pode(usuario.papel, 'financeiro', 'editar')

  return (
    <>
      <Link href="/financeiro" className="mb-3 inline-flex items-center gap-1 text-sm text-muted hover:text-ink">
        <ArrowLeft className="size-4" /> Faturamento
      </Link>
      <PageHeader titulo={`NF ${nota.numero}`} descricao={cliente.nome} acoes={<SituacaoNotaBadge situacao={situacaoNota(nota, dia)} />} />

      <div className="grid gap-6 xl:grid-cols-3">
        <Card titulo="Nota" className="xl:col-span-2">
          <dl className="grid gap-5 sm:grid-cols-3">
            <div className="sm:col-span-3">
              <Dado rotulo="Serviço">{nota.descricao}</Dado>
            </div>
            <Dado rotulo="Emissão">{formatarData(nota.emissao)}</Dado>
            <Dado rotulo="Previsão de pagamento">{formatarData(nota.previsao)}</Dado>
            <Dado rotulo="Processo">
              {processo ? (
                <Link href={`/processos/${processo.id}`} className="text-brand-700 hover:underline">
                  {processo.empreendimento}
                </Link>
              ) : (
                '—'
              )}
              {parcela && <span className="block text-xs text-muted">{parcela.descricao}</span>}
            </Dado>
            <Dado rotulo="Valor">{brl(nota.valor)}</Dado>
            <Dado rotulo="ISS">{brl(nota.iss)}</Dado>
            <Dado rotulo="Retenção na fonte">{nota.retencao ? brl(nota.retencao) : '—'}</Dado>
            <Dado rotulo="Líquido a receber">
              <span className="font-semibold">{brl(valorLiquido(nota))}</span>
            </Dado>
            <Dado rotulo="Recebido">{nota.recebimento ? `${brl(nota.recebimento.valor)} em ${formatarData(nota.recebimento.data)}` : '—'}</Dado>
          </dl>
        </Card>

        {editar && !nota.cancelada && (
          <div className="space-y-6">
            <Card titulo={nota.recebimento ? 'Corrigir recebimento' : 'Registrar recebimento'}>
              <FormularioRecebimento notaId={nota.id} data={nota.recebimento?.data ?? dia} valor={nota.recebimento?.valor ?? valorLiquido(nota)} />
            </Card>
            {!motivoParaNaoCancelar(nota) && (
              <Card titulo="Cancelar nota">
                <p className="mb-3 text-sm text-muted">Use quando a nota foi cancelada na Prefeitura. Ela continua na lista, riscada.</p>
                <BotaoCancelarNota notaId={nota.id} numero={nota.numero} />
              </Card>
            )}
          </div>
        )}
      </div>

      {lancamentos.length > 0 && (
        <Card titulo="No caixa" className="mt-6" flush>
          <table className="tabela">
            <tbody>
              {lancamentos.map((lancamento) => (
                <tr key={lancamento.id}>
                  <td className="whitespace-nowrap">{formatarData(lancamento.data)}</td>
                  <td>{lancamento.descricao}</td>
                  <td className="text-muted">{nomeDaConta(lancamento.contaId)}</td>
                  <td className="num font-medium">{brl(lancamento.valor)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </>
  )
}

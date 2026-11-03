import { ArrowLeft } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { ReactNode } from 'react'
import { SituacaoDaNota } from '@/components/financeiro/situacao-nota'
import { Card } from '@/components/ui/card'
import { Linha, Lista } from '@/components/ui/lista'
import { PageHeader } from '@/components/ui/page-header'
import { Secao } from '@/components/ui/secao'
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
      <dt className="text-sm text-muted">{rotulo}</dt>
      <dd className="mt-0.5 text-ink">{children}</dd>
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
      <PageHeader
        titulo={`NF ${nota.numero}`}
        resumo={
          <span className="inline-flex flex-wrap items-center gap-x-3 gap-y-1">
            {cliente.nome} <SituacaoDaNota situacao={situacaoNota(nota, dia)} />
          </span>
        }
      />

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Secao titulo="Nota">
            <dl className="grid grid-cols-2 gap-x-6 gap-y-4 border-t border-line pt-4 sm:grid-cols-3">
              <div className="col-span-2 sm:col-span-3">
                <Dado rotulo="Serviço">{nota.descricao}</Dado>
              </div>
              <Dado rotulo="Emissão">{formatarData(nota.emissao)}</Dado>
              <Dado rotulo="Previsão de pagamento">{formatarData(nota.previsao)}</Dado>
              <Dado rotulo="Processo">
                {processo ? (
                  <Link href={`/processos/${processo.id}`} className="link">
                    {processo.empreendimento}
                  </Link>
                ) : (
                  '—'
                )}
                {parcela && <span className="block text-sm text-muted">{parcela.descricao}</span>}
              </Dado>
              <Dado rotulo="Valor">{brl(nota.valor)}</Dado>
              <Dado rotulo="ISS">{brl(nota.iss)}</Dado>
              <Dado rotulo="Retenção na fonte">{nota.retencao ? brl(nota.retencao) : '—'}</Dado>
              <Dado rotulo="Líquido a receber">
                <span className="font-semibold">{brl(valorLiquido(nota))}</span>
              </Dado>
              <Dado rotulo="Recebido">{nota.recebimento ? `${brl(nota.recebimento.valor)} em ${formatarData(nota.recebimento.data)}` : '—'}</Dado>
            </dl>
          </Secao>

          {lancamentos.length > 0 && (
            <Secao titulo="No caixa">
              <Lista>
                {lancamentos.map((lancamento) => (
                  <Linha key={lancamento.id}>
                    <span className="w-24 text-muted">{formatarData(lancamento.data)}</span>
                    <span className="min-w-0 flex-1">
                      {lancamento.descricao}
                      <span className="block text-sm text-muted">{nomeDaConta(lancamento.contaId)}</span>
                    </span>
                    <span className="font-medium tabular-nums">{brl(lancamento.valor)}</span>
                  </Linha>
                ))}
              </Lista>
            </Secao>
          )}
        </div>

        {editar && !nota.cancelada && (
          <div className="space-y-6">
            <Card titulo={nota.recebimento ? 'Corrigir recebimento' : 'Registrar recebimento'}>
              <FormularioRecebimento notaId={nota.id} data={nota.recebimento?.data ?? dia} valor={nota.recebimento?.valor ?? valorLiquido(nota)} />
            </Card>
            {!motivoParaNaoCancelar(nota) && (
              <Card titulo="Cancelar nota">
                <p className="mb-3 text-sm text-muted">Quando a nota foi cancelada na Prefeitura. Ela continua na lista, riscada.</p>
                <BotaoCancelarNota notaId={nota.id} numero={nota.numero} />
              </Card>
            )}
          </div>
        )}
      </div>
    </>
  )
}

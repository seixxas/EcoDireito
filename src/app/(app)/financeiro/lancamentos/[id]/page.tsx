import { ArrowLeft } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { ReactNode } from 'react'
import { Card } from '@/components/ui/card'
import { classeBotao } from '@/components/ui/form'
import { PageHeader } from '@/components/ui/page-header'
import { Secao } from '@/components/ui/secao'
import { obterLancamento } from '@/data/financeiro'
import { exigirArea } from '@/data/sessao'
import { nomeDaConta } from '@/domain/financeiro/plano-de-contas'
import { cn } from '@/lib/cn'
import { mesDe } from '@/lib/datas'
import { brl, formatarData, formatarMes } from '@/lib/formatar'
import { pode } from '@/lib/permissoes'
import { excluirLancamento } from '../actions'
import { EXPLICACAO_COMPETENCIA, textoDaCompetencia } from '../../_components/competencia'
import { FormularioEdicao } from './_components/formulario-edicao'

export const metadata: Metadata = { title: 'Lançamento' }

function Dado({ rotulo, children, className }: { rotulo: string; children: ReactNode; className?: string }) {
  return (
    <div className={className}>
      <dt className="text-sm text-muted">{rotulo}</dt>
      <dd className="mt-0.5 text-ink">{children}</dd>
    </div>
  )
}

export default async function PaginaLancamento({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const [usuario, dados] = await Promise.all([exigirArea('financeiro'), obterLancamento(id)])
  if (!dados) notFound()
  const { hoje: dia, lancamento, processos, nota, linhaExtrato } = dados
  const editar = pode(usuario.papel, 'financeiro', 'editar')
  const processo = processos.find((p) => p.id === lancamento.processoId)
  const mes = mesDe(lancamento.data)
  const voltar = mes === mesDe(dia) ? '/financeiro/lancamentos' : `/financeiro/lancamentos?mes=${mes}`

  return (
    <>
      <Link href={voltar} className="mb-3 inline-flex items-center gap-1 text-sm text-muted hover:text-ink">
        <ArrowLeft className="size-4" /> Lançamentos de {formatarMes(mes)}
      </Link>
      <PageHeader titulo={lancamento.descricao} resumo={`${brl(lancamento.valor)} em ${formatarData(lancamento.data)} · ${nomeDaConta(lancamento.contaId)}`} />

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Secao titulo="Lançamento">
            <dl className="grid grid-cols-2 gap-x-6 gap-y-4 border-t border-line pt-4 sm:grid-cols-3">
              <Dado rotulo="Data">{formatarData(lancamento.data)}</Dado>
              <Dado rotulo="Valor">
                <span className={cn('font-semibold', lancamento.valor > 0 && 'text-ok')}>{brl(lancamento.valor)}</span>
              </Dado>
              <Dado rotulo="Conta">{nomeDaConta(lancamento.contaId)}</Dado>
              <Dado rotulo="Competência" className="col-span-2 sm:col-span-3">
                {textoDaCompetencia(lancamento) ? (
                  <span className="font-medium text-warn">{textoDaCompetencia(lancamento)}</span>
                ) : (
                  <>
                    {formatarMes(lancamento.competencia)} <span className="text-sm text-muted">(o mês do pagamento)</span>
                  </>
                )}
                <span className="mt-1 block max-w-prose text-xs text-subtle">{EXPLICACAO_COMPETENCIA}</span>
              </Dado>
              <Dado rotulo="Processo">
                {processo ? (
                  <Link href={`/processos/${processo.id}`} className="link">
                    {processo.empreendimento}
                  </Link>
                ) : (
                  '—'
                )}
              </Dado>
              <Dado rotulo="Nota fiscal">
                {nota ? (
                  <Link href={`/financeiro/notas/${nota.id}`} className="link">
                    NF {nota.numero}
                  </Link>
                ) : (
                  '—'
                )}
              </Dado>
              <Dado rotulo="No extrato do banco" className="col-span-2 sm:col-span-3">
                {linhaExtrato ? (
                  <>
                    {linhaExtrato.descricao}
                    <span className="block text-sm text-muted">
                      {formatarData(linhaExtrato.data)} · arquivo {linhaExtrato.arquivo}
                    </span>
                  </>
                ) : (
                  <span className="text-muted">{nota ? 'Não veio de extrato: é o recebimento registrado na nota.' : 'Não veio de extrato: foi lançado à mão.'}</span>
                )}
              </Dado>
              <Dado rotulo="Observação" className="col-span-2 sm:col-span-3">
                {lancamento.observacao ? <span className="whitespace-pre-line">{lancamento.observacao}</span> : <span className="text-muted">—</span>}
              </Dado>
            </dl>
          </Secao>
        </div>

        {editar && (
          <div className="space-y-6">
            <Card titulo={nota ? 'Observação' : 'Editar'}>
              {nota && <p className="mb-3 text-sm text-muted">Descrição, conta e valor vêm da NF {nota.numero} e mudam pelo recebimento da nota.</p>}
              <FormularioEdicao lancamento={lancamento} processos={processos.map((p) => ({ id: p.id, nome: p.empreendimento }))} soObservacao={Boolean(nota)} />
            </Card>
            {!lancamento.notaId && (
              <Card titulo="Apagar lançamento">
                <p className="mb-3 text-sm text-muted">
                  {linhaExtrato ? 'A linha do extrato volta para a fila “a classificar”.' : 'Some do caixa e da DRE.'} Data e valor não se editam: apague e lance de novo.
                </p>
                <form action={excluirLancamento}>
                  <input type="hidden" name="id" value={lancamento.id} />
                  <input type="hidden" name="voltar" value={voltar} />
                  <button className={classeBotao('perigo')}>Apagar</button>
                </form>
              </Card>
            )}
          </div>
        )}
      </div>
    </>
  )
}

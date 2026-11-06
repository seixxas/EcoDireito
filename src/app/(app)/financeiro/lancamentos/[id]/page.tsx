import type { Metadata } from 'next'
import { LinkRapido } from '@/components/ui/link-rapido'
import { notFound } from 'next/navigation'
import type { ReactNode } from 'react'
import { BotaoConfirmar } from '@/components/ui/botao-confirmar'
import { Card } from '@/components/ui/card'
import { PageHeader } from '@/components/ui/page-header'
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
      <dt className="text-xs font-semibold text-subtle">{rotulo}</dt>
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
      <PageHeader
        titulo={lancamento.descricao}
        voltar={{ href: voltar, rotulo: `Voltar para Lançamentos de ${formatarMes(mes)}` }}
        resumo={`${brl(lancamento.valor)} em ${formatarData(lancamento.data)} · ${nomeDaConta(lancamento.contaId)}`}
      />

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_24rem]">
        <div className="min-w-0">
          <Card titulo="Lançamento">
            <dl className="grid grid-cols-1 gap-x-4 gap-y-3 sm:grid-cols-3">
              <Dado rotulo="Data">{formatarData(lancamento.data)}</Dado>
              <Dado rotulo="Valor">
                <span className={cn('font-semibold', lancamento.valor > 0 && 'text-ok')}>{brl(lancamento.valor)}</span>
              </Dado>
              <Dado rotulo="Conta">{nomeDaConta(lancamento.contaId)}</Dado>
              <Dado rotulo="Competência" className="sm:col-span-full">
                {textoDaCompetencia(lancamento) ? (
                  <span className="font-medium text-warn">{textoDaCompetencia(lancamento)}</span>
                ) : (
                  <>
                    {formatarMes(lancamento.competencia)} <span className="text-xs text-muted">(o mês do pagamento)</span>
                  </>
                )}
                <span className="mt-1 block max-w-prose text-xs text-muted">{EXPLICACAO_COMPETENCIA}</span>
              </Dado>
              <Dado rotulo="Projeto">
                {processo ? (
                  <LinkRapido href={`/projetos/${processo.id}`} className="link">
                    {processo.empreendimento}
                  </LinkRapido>
                ) : (
                  '—'
                )}
              </Dado>
              <Dado rotulo="Nota fiscal">
                {nota ? (
                  <LinkRapido href={`/financeiro/notas/${nota.id}`} className="link">
                    NF {nota.numero}
                  </LinkRapido>
                ) : (
                  '—'
                )}
              </Dado>
              <Dado rotulo="No extrato do banco" className="sm:col-span-full">
                {linhaExtrato ? (
                  <>
                    {linhaExtrato.descricao}
                    <span className="block text-xs text-muted">
                      {formatarData(linhaExtrato.data)} · arquivo {linhaExtrato.arquivo}
                    </span>
                  </>
                ) : (
                  <span className="text-muted">{nota ? 'Não veio de extrato: é o recebimento registrado na nota.' : 'Não veio de extrato: foi lançado à mão.'}</span>
                )}
              </Dado>
              <Dado rotulo="Observação" className="sm:col-span-full">
                {lancamento.observacao ? <span className="whitespace-pre-line">{lancamento.observacao}</span> : <span className="text-muted">—</span>}
              </Dado>
            </dl>
          </Card>
        </div>

        {editar && (
          <div className="space-y-4">
            <Card titulo={nota ? 'Observação' : 'Editar'}>
              {nota && <p className="mb-3">Descrição, conta e valor vêm da NF {nota.numero} e mudam pelo recebimento da nota.</p>}
              <FormularioEdicao lancamento={lancamento} processos={processos.map((p) => ({ id: p.id, nome: p.empreendimento }))} soObservacao={Boolean(nota)} />
            </Card>
            {!lancamento.notaId && (
              <Card titulo="Apagar lançamento">
                <p className="mb-3">
                  {linhaExtrato ? 'A linha do extrato volta para a fila “a classificar”.' : 'Some do caixa e da DRE.'} Data e valor não se editam: apague e lance de novo.
                </p>
                <form action={excluirLancamento}>
                  <input type="hidden" name="id" value={lancamento.id} />
                  <input type="hidden" name="voltar" value={voltar} />
                  <BotaoConfirmar
                    titulo="Apagar este lançamento?"
                    oQue={`${lancamento.descricao} · ${brl(lancamento.valor)} · ${formatarData(lancamento.data)}`}
                    consequencia={linhaExtrato ? 'A linha do extrato volta para a fila “a classificar”.' : 'Some do caixa e da DRE.'}
                    sim="Sim, apagar o lançamento"
                    className="w-full"
                  >
                    Apagar
                  </BotaoConfirmar>
                </form>
              </Card>
            )}
          </div>
        )}
      </div>
    </>
  )
}

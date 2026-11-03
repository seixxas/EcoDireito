import { Trash2 } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { Card } from '@/components/ui/card'
import { Expansivel } from '@/components/ui/expansivel'
import { PageHeader } from '@/components/ui/page-header'
import { listarLancamentos } from '@/data/financeiro'
import { exigirArea } from '@/data/sessao'
import { nomeDaConta } from '@/domain/financeiro/plano-de-contas'
import { cn } from '@/lib/cn'
import { mesDe } from '@/lib/datas'
import { somar } from '@/lib/dinheiro'
import { brl, formatarDataCurta, formatarMes } from '@/lib/formatar'
import { pode } from '@/lib/permissoes'
import { NavegacaoMes } from '../_components/navegacao-mes'
import { excluirLancamento } from './actions'
import { FormularioLancamento } from './_components/formulario-lancamento'

export const metadata: Metadata = { title: 'Lançamentos' }

export default async function PaginaLancamentos({ searchParams }: { searchParams: Promise<{ mes?: string }> }) {
  const [filtros, usuario, { hoje: dia, meses, lancamentos, processos }] = await Promise.all([searchParams, exigirArea('financeiro'), listarLancamentos()])
  const editar = pode(usuario.papel, 'financeiro', 'editar')
  const mes = filtros.mes && meses.includes(filtros.mes) ? filtros.mes : mesDe(dia)
  const doMes = lancamentos.filter((l) => mesDe(l.data) === mes).sort((a, b) => b.data.localeCompare(a.data))
  const entradas = somar(doMes.filter((l) => l.valor > 0).map((l) => l.valor))
  const saidas = somar(doMes.filter((l) => l.valor < 0).map((l) => l.valor))

  return (
    <>
      <PageHeader
        titulo="Lançamentos"
        resumo={`${doMes.length} lançamentos em ${formatarMes(mes)}: entraram ${brl(entradas)} e saíram ${brl(-saidas)}. A receita das notas entra sozinha com o recebimento.`}
        acoes={<NavegacaoMes mes={mes} meses={meses} href={(m) => (m === mesDe(dia) ? '/financeiro/lancamentos' : `/financeiro/lancamentos?mes=${m}`)} />}
      />

      {editar && (
        <Expansivel resumo="Novo lançamento" className="mb-6">
          <Card>
            <FormularioLancamento hoje={dia} processos={processos.map((p) => ({ id: p.id, nome: p.empreendimento }))} />
          </Card>
        </Expansivel>
      )}

      <Card flush>
        <table className="tabela">
          <thead>
            <tr>
              <th>Data</th>
              <th>Descrição</th>
              <th>Conta</th>
              <th>Competência</th>
              <th className="num">Valor</th>
              {editar && <th />}
            </tr>
          </thead>
          <tbody>
            {doMes.map((lancamento) => (
              <tr key={lancamento.id}>
                <td className="whitespace-nowrap">{formatarDataCurta(lancamento.data)}</td>
                <td className="min-w-64">
                  {lancamento.descricao}
                  {lancamento.notaId && (
                    <Link href={`/financeiro/notas/${lancamento.notaId}`} className="block text-xs text-brand-700 hover:underline">
                      ver nota
                    </Link>
                  )}
                  {!lancamento.notaId && lancamento.processoId && (
                    <Link href={`/processos/${lancamento.processoId}`} className="block text-xs text-brand-700 hover:underline">
                      {processos.find((p) => p.id === lancamento.processoId)?.empreendimento}
                    </Link>
                  )}
                </td>
                <td className="text-muted">{nomeDaConta(lancamento.contaId)}</td>
                {/* Só aparece quando a competência é outro mês: é a exceção que importa para a DRE. */}
                <td className="whitespace-nowrap text-warn">{lancamento.competencia !== mes && formatarMes(lancamento.competencia)}</td>
                <td className={cn('num font-medium', lancamento.valor > 0 && 'text-ok')}>{brl(lancamento.valor)}</td>
                {editar && (
                  <td className="text-right">
                    {!lancamento.notaId && (
                      <form action={excluirLancamento}>
                        <input type="hidden" name="id" value={lancamento.id} />
                        <button title="Apagar lançamento" className="rounded-md p-1.5 text-subtle hover:bg-danger-soft hover:text-danger">
                          <Trash2 className="size-4" />
                        </button>
                      </form>
                    )}
                  </td>
                )}
              </tr>
            ))}
            {doMes.length === 0 && (
              <tr>
                <td colSpan={6} className="py-10 text-center text-muted">
                  Nenhum lançamento neste mês.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Card>
    </>
  )
}

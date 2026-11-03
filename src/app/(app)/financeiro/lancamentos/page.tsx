import { Trash2 } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { Card } from '@/components/ui/card'
import { PageHeader } from '@/components/ui/page-header'
import { listarLancamentos } from '@/data/financeiro'
import { exigirArea } from '@/data/sessao'
import { nomeDaConta } from '@/domain/financeiro/plano-de-contas'
import { cn } from '@/lib/cn'
import { mesDe } from '@/lib/datas'
import { somar } from '@/lib/dinheiro'
import { brl, formatarData, formatarMes } from '@/lib/formatar'
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
        descricao="Entradas e saídas do caixa, cada uma na sua conta da DRE. A receita das notas entra sozinha quando o recebimento é registrado."
        acoes={<NavegacaoMes mes={mes} meses={meses} href={(m) => (m === mesDe(dia) ? '/financeiro/lancamentos' : `/financeiro/lancamentos?mes=${m}`)} />}
      />

      {editar && (
        <Card titulo="Novo lançamento" className="mb-6">
          <FormularioLancamento hoje={dia} processos={processos.map((p) => ({ id: p.id, nome: p.empreendimento }))} />
        </Card>
      )}

      <Card
        titulo={`${doMes.length} lançamentos em ${formatarMes(mes)}`}
        acao={
          <span className="text-sm text-muted">
            entradas <span className="font-semibold text-ok">{brl(entradas)}</span> · saídas <span className="font-semibold text-danger">{brl(saidas)}</span>
          </span>
        }
        flush
      >
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
                <td className="whitespace-nowrap">{formatarData(lancamento.data)}</td>
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
                <td className={cn('whitespace-nowrap', lancamento.competencia === mes ? 'text-subtle' : 'text-warn')}>{formatarMes(lancamento.competencia)}</td>
                <td className={cn('num font-medium', lancamento.valor > 0 && 'text-ok')}>{brl(lancamento.valor)}</td>
                {editar && (
                  <td className="text-right">
                    {!lancamento.notaId && (
                      <form action={excluirLancamento}>
                        <input type="hidden" name="id" value={lancamento.id} />
                        <button title="Apagar lançamento" className="rounded-lg p-2 text-subtle hover:bg-danger-soft hover:text-danger">
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

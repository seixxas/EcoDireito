import { Plus } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { GraficoBarras } from '@/components/charts/grafico-barras'
import { SITUACOES_NOTA, SituacaoNotaBadge } from '@/components/financeiro/situacao-nota'
import { Card } from '@/components/ui/card'
import { classeBotao } from '@/components/ui/form'
import { PageHeader } from '@/components/ui/page-header'
import { SegmentedLinks } from '@/components/ui/segmented-links'
import { Stat } from '@/components/ui/stat'
import { listarNotas } from '@/data/financeiro'
import { listarParcelasLiberadas } from '@/data/processos'
import { exigirArea } from '@/data/sessao'
import { resumoNotas, situacaoNota, valorLiquido, type SituacaoNota } from '@/domain/financeiro/notas'
import { mesDe } from '@/lib/datas'
import { somar } from '@/lib/dinheiro'
import { brl, formatarData, formatarMes } from '@/lib/formatar'
import { pode } from '@/lib/permissoes'
import { NavegacaoMes } from './_components/navegacao-mes'

export const metadata: Metadata = { title: 'Faturamento' }

type Filtros = { mes?: string; situacao?: string }

export default async function PaginaFaturamento({ searchParams }: { searchParams: Promise<Filtros> }) {
  const [filtros, { hoje: dia, meses, notas }, parcelas, usuario] = await Promise.all([searchParams, listarNotas(), listarParcelasLiberadas(), exigirArea('financeiro')])
  const editar = pode(usuario.papel, 'financeiro', 'editar')
  const atual = mesDe(dia)
  const mes = filtros.mes && meses.includes(filtros.mes) ? filtros.mes : atual
  const situacao = filtros.situacao ?? 'todos'
  const link = (novos: Filtros) => {
    const params = new URLSearchParams()
    if (novos.mes && novos.mes !== atual) params.set('mes', novos.mes)
    if (novos.situacao && novos.situacao !== 'todos') params.set('situacao', novos.situacao)
    return params.size ? `/financeiro?${params}` : '/financeiro'
  }

  const doPeriodo = notas.filter(({ nota }) => mesDe(nota.emissao) === mes)
  const resumo = resumoNotas(doPeriodo.map(({ nota }) => nota), dia)
  const lista = doPeriodo
    .filter(({ nota }) => situacao === 'todos' || situacaoNota(nota, dia) === situacao)
    .sort((a, b) => b.nota.numero - a.nota.numero)

  const grafico = meses.map((m) => ({
    rotulo: formatarMes(m),
    faturado: somar(notas.filter(({ nota }) => !nota.cancelada && mesDe(nota.emissao) === m).map(({ nota }) => nota.valor)),
    recebido: somar(notas.filter(({ nota }) => nota.recebimento && mesDe(nota.recebimento.data) === m).map(({ nota }) => nota.recebimento!.valor)),
  }))

  return (
    <>
      <PageHeader
        titulo="Faturamento"
        descricao="Notas fiscais emitidas e o que já entrou no caixa. Substitui a planilha de faturamento: cada nota é lançada uma vez e a situação é calculada sozinha."
        acoes={
          <div className="flex items-center gap-3">
            <NavegacaoMes mes={mes} meses={meses} href={(m) => link({ mes: m, situacao })} />
            {editar && (
              <Link href="/financeiro/notas/nova" className={classeBotao()}>
                <Plus className="size-4" /> Registrar nota
              </Link>
            )}
          </div>
        }
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <Stat rotulo="Faturado" valor={brl(resumo.faturado)} detalhe={`${resumo.quantidade} notas`} tom="brand" />
        <Stat rotulo="Recebido" valor={brl(resumo.recebido)} detalhe="líquido de retenções" tom="ok" />
        <Stat rotulo="A receber" valor={brl(resumo.aReceber)} />
        <Stat rotulo="Atrasado" valor={brl(resumo.atrasado)} detalhe={`${resumo.quantidadeAtrasadas} notas`} tom="danger" />
        <Stat rotulo="Prazo para receber" valor={`${resumo.prazoMedianoDias} dias`} detalhe="mediana, da emissão ao pagamento" />
      </div>

      {parcelas.length > 0 && (
        <Card titulo="Parcelas prontas para faturar" className="mb-6" flush>
          <table className="tabela">
            <tbody>
              {parcelas.map(({ parcela, processo, cliente, liberadaEm }) => (
                <tr key={parcela.id}>
                  <td>
                    <Link href={`/processos/${processo.id}`} className="font-medium text-brand-700 hover:underline">
                      {processo.empreendimento}
                    </Link>
                    <p className="text-xs text-muted">{cliente.nome}</p>
                  </td>
                  <td>
                    {parcela.descricao}
                    <p className="text-xs text-muted">liberada em {formatarData(liberadaEm!)}</p>
                  </td>
                  <td className="num font-semibold">{brl(parcela.valor)}</td>
                  {editar && (
                    <td className="text-right">
                      <Link href={`/financeiro/notas/nova?parcela=${parcela.id}`} className={classeBotao('primario', 'whitespace-nowrap py-1.5')}>
                        Registrar nota
                      </Link>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      <Card titulo="Faturado × recebido por mês" className="mb-6">
        <GraficoBarras
          dados={grafico}
          series={[
            { chave: 'faturado', nome: 'Faturado (emissão)', cor: 'var(--color-brand-700)' },
            { chave: 'recebido', nome: 'Recebido (caixa)', cor: 'var(--color-brand-300)' },
          ]}
        />
      </Card>

      <div className="mb-3">
        <SegmentedLinks
          ativo={situacao}
          opcoes={[{ valor: 'todos', rotulo: 'Todas' }, ...Object.entries(SITUACOES_NOTA).map(([valor, { rotulo }]) => ({ valor, rotulo }))].map((o) => ({
            ...o,
            href: link({ mes, situacao: o.valor }),
            contagem: o.valor === 'todos' ? doPeriodo.length : doPeriodo.filter(({ nota }) => situacaoNota(nota, dia) === (o.valor as SituacaoNota)).length,
          }))}
        />
      </div>

      <Card flush>
        <table className="tabela">
          <thead>
            <tr>
              <th>NF</th>
              <th>Emissão</th>
              <th>Cliente</th>
              <th>Serviço</th>
              <th className="num">Valor</th>
              <th className="num">Líquido</th>
              <th>Previsão</th>
              <th>Situação</th>
            </tr>
          </thead>
          <tbody>
            {lista.map(({ nota, cliente, processo }) => (
              <tr key={nota.id} className={nota.cancelada ? 'text-subtle line-through decoration-subtle/50' : undefined}>
                <td className="font-mono text-xs">
                  <Link href={`/financeiro/notas/${nota.id}`} className="text-brand-700 hover:underline">
                    {nota.numero}
                  </Link>
                </td>
                <td className="whitespace-nowrap">{formatarData(nota.emissao)}</td>
                <td className="min-w-72">
                  {cliente.nome}
                  {cliente.grupo && <p className="text-xs text-subtle">Grupo {cliente.grupo}</p>}
                </td>
                <td className="min-w-44 text-muted">
                  {nota.descricao}
                  {processo && (
                    <Link href={`/processos/${processo.id}`} className="block text-xs text-brand-700 hover:underline">
                      ver processo
                    </Link>
                  )}
                </td>
                <td className="num">{brl(nota.valor)}</td>
                <td className="num font-medium">
                  {brl(valorLiquido(nota))}
                  {nota.retencao > 0 && <p className="text-xs font-normal text-subtle">retido {brl(nota.retencao)}</p>}
                </td>
                <td className="whitespace-nowrap">{formatarData(nota.previsao)}</td>
                <td>
                  <SituacaoNotaBadge situacao={situacaoNota(nota, dia)} />
                </td>
              </tr>
            ))}
            {lista.length === 0 && (
              <tr>
                <td colSpan={8} className="py-10 text-center text-muted">
                  Nenhuma nota neste filtro.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Card>
    </>
  )
}

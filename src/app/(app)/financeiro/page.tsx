import { Plus } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { GraficoBarras } from '@/components/charts/grafico-barras'
import { SITUACOES_NOTA, SituacaoDaNota } from '@/components/financeiro/situacao-nota'
import { Abas } from '@/components/ui/abas'
import { Card } from '@/components/ui/card'
import { Vazio } from '@/components/ui/expansivel'
import { classeBotao } from '@/components/ui/form'
import { Linha, Lista } from '@/components/ui/lista'
import { PageHeader } from '@/components/ui/page-header'
import { Paginacao } from '@/components/ui/paginacao'
import { ItemResumo, Resumo } from '@/components/ui/resumo'
import { Secao } from '@/components/ui/secao'
import { SegmentedLinks } from '@/components/ui/segmented-links'
import { listarNotas } from '@/data/financeiro'
import { listarParcelasLiberadas } from '@/data/processos'
import { exigirArea } from '@/data/sessao'
import { resumoNotas, situacaoNota, valorLiquido, type SituacaoNota } from '@/domain/financeiro/notas'
import { mesDe } from '@/lib/datas'
import { somar } from '@/lib/dinheiro'
import { brl, contar, formatarData, formatarDataCurta, formatarMes } from '@/lib/formatar'
import { paginar } from '@/lib/paginar'
import { pode } from '@/lib/permissoes'
import { AbrirLinha } from './_components/abrir-linha'
import { NavegacaoMes } from './_components/navegacao-mes'

export const metadata: Metadata = { title: 'Faturamento' }

type Filtros = { mes?: string; situacao?: string; aba?: string; pagina?: string }

export default async function PaginaFaturamento({ searchParams }: { searchParams: Promise<Filtros> }) {
  const [filtros, { hoje: dia, meses, notas }, parcelas, usuario] = await Promise.all([searchParams, listarNotas(), listarParcelasLiberadas(), exigirArea('financeiro')])
  const editar = pode(usuario.papel, 'financeiro', 'editar')
  const atual = mesDe(dia)
  const mes = filtros.mes && meses.includes(filtros.mes) ? filtros.mes : atual
  const situacao = filtros.situacao ?? 'todos'
  const aba = filtros.aba === 'grafico' ? 'grafico' : 'notas'
  const link = (novos: Filtros) => {
    const params = new URLSearchParams()
    if (novos.mes && novos.mes !== atual) params.set('mes', novos.mes)
    if (novos.situacao && novos.situacao !== 'todos') params.set('situacao', novos.situacao)
    if (novos.aba && novos.aba !== 'notas') params.set('aba', novos.aba)
    if (novos.pagina && novos.pagina !== '1') params.set('pagina', novos.pagina)
    return params.size ? `/financeiro?${params}` : '/financeiro'
  }

  const doMes = notas.filter(({ nota }) => mesDe(nota.emissao) === mes)
  const resumo = resumoNotas(doMes.map(({ nota }) => nota), dia)
  const lista = doMes.filter(({ nota }) => situacao === 'todos' || situacaoNota(nota, dia) === situacao).sort((a, b) => b.nota.numero - a.nota.numero)
  const paginado = paginar(lista, filtros.pagina)

  const grafico = meses.map((m) => ({
    rotulo: formatarMes(m),
    faturado: somar(notas.filter(({ nota }) => !nota.cancelada && mesDe(nota.emissao) === m).map(({ nota }) => nota.valor)),
    recebido: somar(notas.filter(({ nota }) => nota.recebimento && mesDe(nota.recebimento.data) === m).map(({ nota }) => nota.recebimento!.valor)),
  }))

  return (
    <>
      <PageHeader
        titulo="Faturamento"
        resumo={
          resumo.quantidade
            ? `${brl(resumo.faturado)} em ${contar(resumo.quantidade, 'nota', 'notas')} em ${formatarMes(mes)}; ${brl(resumo.aReceber)} ainda a receber.`
            : `Nenhuma nota emitida em ${formatarMes(mes)}.`
        }
        acoes={
          <>
            <NavegacaoMes mes={mes} meses={meses} href={(m) => link({ mes: m, situacao, aba })} />
            {editar && (
              <Link href="/financeiro/notas/nova" className={classeBotao()}>
                <Plus className="size-4" /> Registrar nota
              </Link>
            )}
          </>
        }
      />

      <Resumo className="mb-8">
        <ItemResumo rotulo="Faturado" valor={brl(resumo.faturado)} detalhe={contar(resumo.quantidade, 'nota', 'notas')} />
        <ItemResumo
          rotulo="Recebido"
          valor={brl(resumo.recebido)}
          detalhe={resumo.prazoMedianoDias > 0 && `mediana de ${contar(resumo.prazoMedianoDias, 'dia', 'dias')} até receber`}
          tom={resumo.recebido ? 'ok' : 'neutral'}
        />
        <ItemResumo rotulo="A receber" valor={brl(resumo.aReceber)} />
        <ItemResumo
          rotulo="Atrasado"
          valor={brl(resumo.atrasado)}
          detalhe={contar(resumo.quantidadeAtrasadas, 'nota', 'notas')}
          tom={resumo.atrasado ? 'danger' : 'neutral'}
        />
      </Resumo>

      {parcelas.length > 0 && (
        <Secao titulo={`Prontas para faturar · ${brl(somar(parcelas.map(({ parcela }) => parcela.valor)))}`} className="mb-8">
          <Lista>
            {parcelas.map(({ parcela, processo, cliente, liberadaEm }) => (
              <Linha key={parcela.id} className="flex-wrap gap-y-2">
                {/* No celular, valor e botão descem para a linha de baixo em vez de espremer o nome. */}
                <div className="min-w-0 flex-1 basis-60">
                  <Link href={`/processos/${processo.id}`} className="font-medium text-ink hover:text-brand-700">
                    {processo.empreendimento}
                  </Link>
                  <p className="truncate text-sm text-muted">
                    {parcela.descricao} · liberada em {formatarDataCurta(liberadaEm!)} · {cliente.nome}
                  </p>
                </div>
                <span className="font-medium tabular-nums">{brl(parcela.valor)}</span>
                {editar && (
                  <Link href={`/financeiro/notas/nova?parcela=${parcela.id}`} className={classeBotao('secundario', 'py-1')}>
                    Registrar nota
                  </Link>
                )}
              </Linha>
            ))}
          </Lista>
        </Secao>
      )}

      <Abas
        ativa={aba}
        abas={[
          { valor: 'notas', rotulo: `Notas de ${formatarMes(mes)}`, href: link({ mes, situacao }), contagem: doMes.length },
          { valor: 'grafico', rotulo: 'Faturado × recebido no ano', href: link({ mes, situacao, aba: 'grafico' }) },
        ]}
      />

      {aba === 'grafico' ? (
        <GraficoBarras
          dados={grafico}
          series={[
            { chave: 'faturado', nome: 'Faturado (emissão)', cor: 'var(--color-brand-700)' },
            { chave: 'recebido', nome: 'Recebido (caixa)', cor: 'var(--color-brand-300)' },
          ]}
        />
      ) : (
        <>
          <div className="mb-3">
            <SegmentedLinks
              ativo={situacao}
              opcoes={[{ valor: 'todos', rotulo: 'Todas' }, ...Object.entries(SITUACOES_NOTA).map(([valor, { rotulo }]) => ({ valor, rotulo }))].map((o) => ({
                ...o,
                href: link({ mes, situacao: o.valor }),
                contagem: o.valor === 'todos' ? doMes.length : doMes.filter(({ nota }) => situacaoNota(nota, dia) === (o.valor as SituacaoNota)).length,
              }))}
            />
          </div>
          <Card flush>
            <table className="tabela">
              <thead>
                <tr>
                  <th>NF</th>
                  <th className="hidden sm:table-cell">Emissão</th>
                  <th>Cliente e serviço</th>
                  <th className="num">Líquido</th>
                  <th className="hidden sm:table-cell">Previsão</th>
                  <th className="hidden sm:table-cell">Situação</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {paginado.itens.map(({ nota, cliente }) => (
                  <tr key={nota.id} className={nota.cancelada ? 'text-subtle line-through decoration-subtle/50' : undefined}>
                    <td className="tabular-nums">
                      <Link href={`/financeiro/notas/${nota.id}`} className="link">
                        {nota.numero}
                      </Link>
                    </td>
                    <td className="hidden whitespace-nowrap sm:table-cell">{formatarDataCurta(nota.emissao)}</td>
                    <td className="sm:min-w-72">
                      {cliente.nome}
                      <p className="text-xs text-subtle">{nota.descricao}</p>
                      {/* No celular a coluna Situação some; ela vem para baixo do cliente. */}
                      <span className="sm:hidden">
                        <SituacaoDaNota situacao={situacaoNota(nota, dia)} />
                      </span>
                    </td>
                    <td className="num font-medium">
                      {brl(valorLiquido(nota))}
                      {nota.retencao > 0 && <p className="text-xs font-normal text-subtle">de {brl(nota.valor)}</p>}
                    </td>
                    <td className="hidden whitespace-nowrap sm:table-cell">{formatarData(nota.previsao)}</td>
                    <td className="hidden sm:table-cell">
                      <SituacaoDaNota situacao={situacaoNota(nota, dia)} />
                    </td>
                    <AbrirLinha href={`/financeiro/notas/${nota.id}`} rotulo={`Abrir NF ${nota.numero}`} />
                  </tr>
                ))}
              </tbody>
            </table>
            {lista.length === 0 && <Vazio>Nenhuma nota neste filtro.</Vazio>}
          </Card>
          <Paginacao {...paginado} href={(n) => link({ mes, situacao, pagina: String(n) })} />
        </>
      )}
    </>
  )
}

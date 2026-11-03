import { Plus } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { GraficoBarras } from '@/components/charts/grafico-barras'
import { SITUACOES_NOTA, SituacaoDaNota } from '@/components/financeiro/situacao-nota'
import { Abas } from '@/components/ui/abas'
import { Busca } from '@/components/ui/busca'
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
import { combina } from '@/lib/buscar'
import { mesDe } from '@/lib/datas'
import { somar } from '@/lib/dinheiro'
import { brl, contar, formatarData, formatarDataCurta, formatarMes } from '@/lib/formatar'
import { paginar } from '@/lib/paginar'
import { pode } from '@/lib/permissoes'
import { AbrirLinha } from './_components/abrir-linha'
import { NavegacaoMes, TODOS_OS_MESES } from './_components/navegacao-mes'

export const metadata: Metadata = { title: 'Faturamento' }

type Filtros = { mes?: string; situacao?: string; aba?: string; q?: string; pagina?: string }

export default async function PaginaFaturamento({ searchParams }: { searchParams: Promise<Filtros> }) {
  const [filtros, { hoje: dia, meses, notas }, parcelas, usuario] = await Promise.all([searchParams, listarNotas(), listarParcelasLiberadas(), exigirArea('financeiro')])
  const editar = pode(usuario.papel, 'financeiro', 'editar')
  const atual = mesDe(dia)
  const mes = filtros.mes === TODOS_OS_MESES || meses.includes(filtros.mes ?? '') ? filtros.mes! : atual
  const situacao = filtros.situacao ?? 'todos'
  const aba = filtros.aba === 'grafico' ? 'grafico' : 'notas'
  const q = filtros.q?.trim() || undefined
  /** Link com os filtros de agora trocando só o que vier em `novos` (a página volta para a 1). */
  const link = (novos: Filtros) => {
    const f = { mes, situacao, aba, q, ...novos }
    const params = new URLSearchParams()
    if (f.mes && f.mes !== atual) params.set('mes', f.mes)
    if (f.situacao && f.situacao !== 'todos') params.set('situacao', f.situacao)
    if (f.aba && f.aba !== 'notas') params.set('aba', f.aba)
    if (f.q) params.set('q', f.q)
    if (f.pagina && f.pagina !== '1') params.set('pagina', f.pagina)
    return params.size ? `/financeiro?${params}` : '/financeiro'
  }
  const todosOsMeses = mes === TODOS_OS_MESES
  const periodo = todosOsMeses ? 'em todos os meses' : `em ${formatarMes(mes)}`

  // Mês e busca valem para o resumo, as contagens e a lista; a situação só para a lista.
  const doMes = notas.filter(
    ({ nota, cliente, processo }) =>
      (todosOsMeses || mesDe(nota.emissao) === mes) && combina(q, cliente.nome, cliente.grupo, nota.numero, nota.descricao, processo?.empreendimento),
  )
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
            ? `${brl(resumo.faturado)} em ${contar(resumo.quantidade, 'nota', 'notas')}${q ? ` com “${q}”` : ''} ${periodo}; ${brl(resumo.aReceber)} ainda a receber.`
            : `Nenhuma nota${q ? ` com “${q}”` : ' emitida'} ${periodo}.`
        }
        acoes={
          <>
            <NavegacaoMes mes={mes} meses={meses} href={(m) => link({ mes: m })} todos />
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
          { valor: 'notas', rotulo: todosOsMeses ? 'Notas de todos os meses' : `Notas de ${formatarMes(mes)}`, href: link({ aba: 'notas' }), contagem: doMes.length },
          { valor: 'grafico', rotulo: 'Faturado × recebido no ano', href: link({ aba: 'grafico' }) },
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
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <Busca
              valor={q}
              placeholder="Buscar cliente, grupo, NF ou serviço"
              manter={{ mes: mes === atual ? undefined : mes, situacao: situacao === 'todos' ? undefined : situacao }}
              limpar={link({ q: undefined })}
              className="min-w-60"
            />
            <SegmentedLinks
              ativo={situacao}
              opcoes={[{ valor: 'todos', rotulo: 'Todas' }, ...Object.entries(SITUACOES_NOTA).map(([valor, { rotulo }]) => ({ valor, rotulo }))].map((o) => ({
                ...o,
                href: link({ situacao: o.valor }),
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
            {lista.length === 0 && (
              <Vazio>
                Nenhuma nota neste filtro {periodo}.
                {q && !todosOsMeses && (
                  <>
                    {' '}
                    <Link href={link({ mes: TODOS_OS_MESES })} className="link">
                      Buscar em todos os meses
                    </Link>
                  </>
                )}
              </Vazio>
            )}
          </Card>
          <Paginacao {...paginado} href={(n) => link({ pagina: String(n) })} />
        </>
      )}
    </>
  )
}

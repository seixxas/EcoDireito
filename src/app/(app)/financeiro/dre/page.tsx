import type { Metadata } from 'next'
import Link from 'next/link'
import type { ReactNode } from 'react'
import { Expansivel } from '@/components/ui/expansivel'
import { classeBotao } from '@/components/ui/form'
import { PageHeader } from '@/components/ui/page-header'
import { Paginacao } from '@/components/ui/paginacao'
import { SegmentedLinks } from '@/components/ui/segmented-links'
import { dadosDaDre } from '@/data/financeiro'
import { csvDaDre, itensDaLinha, montarDre, periodosDaDre, rotuloDaLinha, type ItemDaDre, type LinhaDre, type Regime } from '@/domain/financeiro/dre'
import { nomeDaConta } from '@/domain/financeiro/plano-de-contas'
import { mesDe } from '@/lib/datas'
import { somar } from '@/lib/dinheiro'
import { brl, formatarData, formatarMes, formatarPercentual } from '@/lib/formatar'
import { paginar } from '@/lib/paginar'
import { BotaoExportar } from './_components/botao-exportar'
import { RolarParaVista } from './_components/rolar-para-vista'
import { TabelaDre } from './_components/tabela-dre'

export const metadata: Metadata = { title: 'DRE' }

type Filtros = { regime?: string; periodo?: string; linha?: string; mes?: string; pagina?: string }

const REGIMES: Record<Regime, { rotulo: string; explicacao: string }> = {
  caixa: { rotulo: 'Por caixa', explicacao: 'Cada valor no mês em que o dinheiro entrou ou saiu da conta.' },
  competencia: { rotulo: 'Por competência', explicacao: 'Receita no mês em que a nota foi emitida; impostos no mês a que se referem.' },
}

const COMO_LER: [string, string][] = [
  ['Lançamentos', 'Clique em qualquer valor para ver, abaixo da tabela, o que o forma. Subtotal não abre: ele é a soma das linhas de cima.'],
  ['% rec. líq.', 'Quanto a linha representa da receita líquida do período.'],
  ['Período', 'Fica travado à direita quando a tabela rola. O mês atual ainda recebe lançamentos: para não misturar, escolha "Até o último mês fechado".'],
  ['Movimentação de caixa', 'Não entra no resultado: distribuição de lucros, mútuo, aplicações e imobilizado.'],
]

function Filtro({ rotulo, children }: { rotulo: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs text-muted">{rotulo}</span>
      {children}
    </div>
  )
}

function linkDoItem(item: ItemDaDre) {
  return item.origem === 'nota' ? `/financeiro/notas/${item.id}` : `/financeiro/lancamentos/${item.id}`
}

/** O que forma o valor escolhido na grade. Fica abaixo dela, na mesma largura. */
function QuadroDeLancamentos(props: { linha: LinhaDre; periodo: string; itens: ItemDaDre[]; pagina?: string; hrefPagina: (pagina: number) => string; hrefFechar: string }) {
  const { linha, periodo, itens, pagina, hrefPagina, hrefFechar } = props
  const paginado = paginar(itens, pagina)
  const soma = brl(somar(itens.map((item) => item.valor)))
  return (
    <section aria-label="Lançamentos de origem" className="mt-4 rounded-lg border border-line bg-surface">
      <header className="flex flex-wrap items-start justify-between gap-3 px-4 pt-4">
        <div className="min-w-0">
          <p className="text-xs text-muted">
            {rotuloDaLinha(linha)} › {periodo}
          </p>
          <h2 className="text-base font-semibold text-ink">{itens.length === 1 ? `1 lançamento soma ${soma}` : `${itens.length} lançamentos somam ${soma}`}</h2>
        </div>
        <Link href={hrefFechar} scroll={false} className={classeBotao('secundario')}>
          Fechar
        </Link>
      </header>
      <div className="mt-2 overflow-x-auto">
        <table className="tabela">
          <thead>
            <tr>
              <th>Data</th>
              <th>Descrição</th>
              {linha.tipo === 'bloco' && <th>Conta</th>}
              <th className="num">Valor</th>
            </tr>
          </thead>
          <tbody>
            {paginado.itens.map((item) => (
              <tr key={item.id}>
                <td className="whitespace-nowrap">{formatarData(item.data)}</td>
                <td>
                  <Link href={linkDoItem(item)} className="link">
                    {item.descricao}
                  </Link>
                </td>
                {linha.tipo === 'bloco' && <td className="text-muted">{nomeDaConta(item.contaId)}</td>}
                <td className="num">{brl(item.valor)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="px-4 pb-3 [&:has(nav)]:pt-3">
        <Paginacao {...paginado} href={hrefPagina} />
      </div>
    </section>
  )
}

export default async function PaginaDre({ searchParams }: { searchParams: Promise<Filtros> }) {
  const filtros = await searchParams
  const regime: Regime = filtros.regime === 'competencia' ? 'competencia' : 'caixa'
  const { hoje, meses: todosOsMeses, notas, lancamentos } = await dadosDaDre()
  const periodos = periodosDaDre(todosOsMeses, mesDe(hoje))
  const periodo = periodos.find((p) => p.id === filtros.periodo) ?? periodos[0]
  const { meses } = periodo
  const rotuloDoPeriodo = meses.length > 1 ? `${formatarMes(meses[0])} a ${formatarMes(meses.at(-1)!)}` : formatarMes(meses[0])

  const linhas = montarDre({ lancamentos, notas, meses, regime })
  const receitaLiquida = linhas.find((l) => l.id === 'subtotal-imposto')?.total ?? 0
  const resultado = linhas.find((l) => l.id === 'subtotal-outras')?.total ?? 0

  const params = new URLSearchParams()
  if (regime !== 'caixa') params.set('regime', regime)
  if (periodo.id !== 'tudo') params.set('periodo', periodo.id)
  const consulta = params.toString()
  const link = (novos: Partial<Filtros>) => {
    const copia = new URLSearchParams(consulta)
    for (const [chave, valor] of Object.entries(novos)) {
      if (valor) copia.set(chave, valor)
      else copia.delete(chave)
    }
    return copia.size ? `/financeiro/dre?${copia}` : '/financeiro/dre'
  }

  const escolhida = linhas.find((l) => l.id === filtros.linha && (l.tipo === 'conta' || l.tipo === 'bloco'))
  const mes = filtros.mes && meses.includes(filtros.mes) ? filtros.mes : undefined
  const itens = escolhida ? itensDaLinha({ linha: escolhida.id, lancamentos, notas, meses: mes ? [mes] : meses, regime }) : []

  return (
    <>
      <PageHeader
        titulo="DRE"
        resumo={
          <>
            Resultado líquido de <strong className={resultado < 0 ? 'text-danger' : 'text-ink'}>{brl(resultado)}</strong> de {rotuloDoPeriodo}
            {receitaLiquida ? `, ${formatarPercentual(resultado / receitaLiquida)} da receita líquida` : ''}. {REGIMES[regime].explicacao}
          </>
        }
        acoes={<BotaoExportar csv={csvDaDre(linhas, meses)} arquivo={`dre-eco-direito-${regime}-${periodo.id}.csv`} />}
      />

      <div className="mb-4 flex flex-wrap items-end gap-x-5 gap-y-3">
        <Filtro rotulo="Regime">
          <SegmentedLinks
            ativo={regime}
            opcoes={Object.entries(REGIMES).map(([valor, { rotulo }]) => ({
              valor,
              rotulo,
              href: link({ regime: valor === 'caixa' ? undefined : valor, linha: undefined, mes: undefined, pagina: undefined }),
            }))}
          />
        </Filtro>
        <Filtro rotulo="Período">
          <SegmentedLinks
            ativo={periodo.id}
            opcoes={periodos.map(({ id, rotulo }) => ({
              valor: id,
              rotulo,
              href: link({ periodo: id === 'tudo' ? undefined : id, linha: undefined, mes: undefined, pagina: undefined }),
            }))}
          />
        </Filtro>
        <p className="ml-auto text-xs text-muted">Valores em reais</p>
      </div>

      <TabelaDre
        meses={meses}
        linhas={linhas}
        receitaLiquida={receitaLiquida}
        rotuloDoPeriodo={rotuloDoPeriodo}
        consulta={consulta}
        selecao={escolhida && { linha: escolhida.id, mes }}
      />

      {escolhida && (
        <RolarParaVista chave={`${escolhida.id}-${mes ?? periodo.id}-${filtros.pagina ?? 1}`}>
          <QuadroDeLancamentos
            linha={escolhida}
            periodo={mes ? formatarMes(mes) : rotuloDoPeriodo}
            itens={itens}
            pagina={filtros.pagina}
            hrefPagina={(pagina) => link({ linha: escolhida.id, mes, pagina: String(pagina) })}
            hrefFechar={link({})}
          />
        </RolarParaVista>
      )}

      <Expansivel resumo="Como ler" className="mt-4">
        <dl className="grid gap-x-8 gap-y-3 rounded-lg border border-line bg-surface p-4 text-sm sm:grid-cols-2 xl:grid-cols-4">
          {COMO_LER.map(([titulo, texto]) => (
            <div key={titulo}>
              <dt className="font-medium text-ink">{titulo}</dt>
              <dd className="text-muted">{texto}</dd>
            </div>
          ))}
        </dl>
      </Expansivel>
    </>
  )
}

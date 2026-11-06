import type { Metadata } from 'next'
import { LinkRapido } from '@/components/ui/link-rapido'
import { Card } from '@/components/ui/card'
import { Expansivel } from '@/components/ui/expansivel'
import { classeBotao } from '@/components/ui/form'
import { PageHeader } from '@/components/ui/page-header'
import { Paginacao } from '@/components/ui/paginacao'
import { SegmentedLinks } from '@/components/ui/segmented-links'
import { dadosDaDre } from '@/data/financeiro'
import { itensDaLinha, montarDre, periodosDaDre, rotuloDaLinha, type ItemDaDre, type LinhaDre, type Regime } from '@/domain/financeiro/dre'
import { nomeDaConta } from '@/domain/financeiro/plano-de-contas'
import { mesDe } from '@/lib/datas'
import { somar } from '@/lib/dinheiro'
import { brl, formatarData, formatarMes, formatarPercentual } from '@/lib/formatar'
import { paginar } from '@/lib/paginar'
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
  ['% da receita líquida', 'Quanto a linha representa da receita líquida do período.'],
  ['Período', 'Em tela larga, fica parado à direita quando a tabela rola. O mês atual ainda recebe lançamentos: para não misturar, escolha "Até o último mês fechado".'],
  ['Movimentação de caixa', 'Não entra no resultado: distribuição de lucros, mútuo, aplicações e imobilizado.'],
]

/** No celular, cada lançamento vira um cartão, em vez de a tabela rolar para o lado. */
const TABELA_EMPILHADA =
  'tabela min-w-0 max-sm:block max-sm:[&_tbody]:mt-3 max-sm:[&_tbody]:block max-sm:[&_thead]:hidden max-sm:[&_tr]:mb-2 max-sm:[&_tr]:flex max-sm:[&_tr]:flex-wrap max-sm:[&_tr]:items-center max-sm:[&_tr]:justify-between max-sm:[&_tr]:rounded-xl max-sm:[&_tr]:bg-surface max-sm:[&_tr]:py-2 max-sm:[&_td]:py-1 max-sm:[&_td:first-child]:w-full'

function linkDoItem(item: ItemDaDre) {
  return item.origem === 'nota' ? `/financeiro/notas/${item.id}` : `/financeiro/lancamentos/${item.id}`
}

/** O que forma o valor escolhido na grade. Fica abaixo dela, na mesma largura. */
function QuadroDeLancamentos(props: { linha: LinhaDre; periodo: string; itens: ItemDaDre[]; pagina?: string; hrefPagina: (pagina: number) => string; hrefFechar: string }) {
  const { linha, periodo, itens, pagina, hrefPagina, hrefFechar } = props
  const paginado = paginar(itens, pagina)
  const soma = brl(somar(itens.map((item) => item.valor)))
  return (
    <Card
      className="mt-6"
      flush
      titulo={
        <>
          <span className="block text-sm font-normal text-muted">
            {rotuloDaLinha(linha)} › {periodo}
          </span>
          {itens.length === 1 ? '1 lançamento soma' : `${itens.length} lançamentos somam`} <span className="whitespace-nowrap">{soma}</span>
        </>
      }
      acao={
        <LinkRapido href={hrefFechar} scroll={false} className={classeBotao('secundario')}>
          Fechar
        </LinkRapido>
      }
    >
      <table className={TABELA_EMPILHADA}>
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
                <LinkRapido href={linkDoItem(item)} className="link inline-flex min-h-12 items-center">
                  {item.descricao}
                </LinkRapido>
              </td>
              {linha.tipo === 'bloco' && <td className="text-muted">{nomeDaConta(item.contaId)}</td>}
              <td className="num">{brl(item.valor)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="px-3 pb-2">
        <Paginacao {...paginado} href={hrefPagina} />
      </div>
    </Card>
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
        acoes={
          <a href={`/financeiro/dre/exportar${consulta ? `?${consulta}` : ''}`} download className={classeBotao('primario', 'min-h-14 text-[1.25rem]')}>
            Exportar para Excel
          </a>
        }
      />

      <div className="flex flex-wrap items-end gap-x-7 gap-y-4">
        <SegmentedLinks
          rotulo="Regime"
          ativo={regime}
          opcoes={Object.entries(REGIMES).map(([valor, { rotulo }]) => ({
            valor,
            rotulo,
            href: link({ regime: valor === 'caixa' ? undefined : valor, linha: undefined, mes: undefined, pagina: undefined }),
          }))}
        />
        <SegmentedLinks
          rotulo="Período"
          ativo={periodo.id}
          opcoes={periodos.map(({ id, rotulo }) => ({
            valor: id,
            rotulo,
            href: link({ periodo: id === 'tudo' ? undefined : id, linha: undefined, mes: undefined, pagina: undefined }),
          }))}
        />
      </div>

      <p className="mb-3 mt-7 text-sm text-muted">
        Valores em reais.{' '}
        <span className="hidden xl:inline">
          <strong className="font-semibold text-ink">A primeira coluna e o total do período ficam parados</strong>; os meses andam no meio.{' '}
        </span>
        Clique num valor para ver o que o forma.
      </p>

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

      <Expansivel resumo="Como ler esta tabela" className="mt-5">
        <dl className="grid gap-x-8 gap-y-4 rounded-xl bg-painel p-6 text-sm sm:grid-cols-2 xl:grid-cols-4">
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

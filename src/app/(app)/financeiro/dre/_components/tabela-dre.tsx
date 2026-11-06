'use client'

import Link from 'next/link'
import { Fragment, useState, type ReactNode } from 'react'
import { classeBotao } from '@/components/ui/form'
import { rotuloDaLinha, type LinhaDre } from '@/domain/financeiro/dre'
import { cn } from '@/lib/cn'
import { formatarMes, formatarPercentual, numeroInteiro } from '@/lib/formatar'
import { TabelaRolavel } from './tabela-rolavel'

export type SelecaoDre = { linha: string; mes?: string }

/**
 * Grade no estilo da planilha: cada mês é um bloco, com linha forte nas bordas, e um espaço entre um bloco e outro.
 * Bordas por lado, sem border-collapse, para as células travadas levarem as linhas ao rolar.
 */
const LINHA = 'border-b border-b-line'
const LINHA_FORTE = 'border-y-2 border-y-brand-700'
const CABECALHO = 'border-b-2 border-b-grade bg-painel font-semibold'
const BORDA_DO_MES = 'border-x border-x-grade'
const ESPACO = 'w-3 min-w-3 p-0'

/**
 * Larguras em rem, para acompanharem a letra, que cresce em monitor grande. Com elas, 3 meses inteiros cabem entre as colunas travadas em 1366 px e
 * 6 em 1920 px. O realizado cabe −99.999.999 em negrito e o percentual, −999,9%. Em tela menor que `xl`, o período não trava: não sobraria lugar para os meses.
 */
const CONTAS = 'w-[11.5rem] min-w-[11.5rem] md:w-[20.5rem] md:min-w-[20.5rem] min-[87.5rem]:w-[24.5rem] min-[87.5rem]:min-w-[24.5rem]'
const ROTULO_FIXO = cn('sticky left-0 z-10 border-r-2 border-r-grade px-3 text-left', CONTAS)
const FIXA = 'z-10 xl:sticky'
const REALIZADO = cn(FIXA, 'right-[8rem] w-[9.5rem] min-w-[9.5rem] border-l-2 border-l-grade')
const PERCENTUAL = cn(FIXA, 'right-0 w-[8rem] min-w-[8rem]')
const ESPACO_FIXO = cn(FIXA, 'right-[17.5rem]', ESPACO)

const SELECIONADA = 'bg-rail outline-2 -outline-offset-2 outline-ink'
const BOTAO_DA_LINHA =
  'inline-flex min-h-12 min-w-[5.75rem] shrink-0 items-center justify-center gap-1 rounded-md border-2 border-brand-700 bg-surface px-2 text-2xs font-semibold text-brand-700 transition-colors hover:bg-brand-50'

/** Fecha o resultado: vai como a linha de total. */
const RESULTADO_LIQUIDO = 'subtotal-outras'

/** O link ocupa a célula inteira: é ele que precisa ser fácil de acertar. */
function Valor({ href, escolhido, cor, titulo, children }: { href?: string; escolhido: boolean; cor?: string; titulo: string; children: ReactNode }) {
  const classe = cn('flex min-h-14 items-center justify-end rounded-md px-2', cor)
  if (!href) return <span className={classe}>{children}</span>
  return (
    <Link href={href} scroll={false} aria-current={escolhido || undefined} title={titulo} className={cn(classe, escolhido ? SELECIONADA : 'hover:bg-rail hover:underline')}>
      {children}
    </Link>
  )
}

/** Células vazias da linha de seção, para as bordas dos blocos seguirem contínuas. */
function GradeVazia({ meses }: { meses: string[] }) {
  return (
    <>
      {meses.map((mes) => (
        <Fragment key={mes}>
          <td className={cn(ESPACO, 'bg-surface')} />
          <td className={cn('bg-surface', BORDA_DO_MES, LINHA)} />
        </Fragment>
      ))}
      <td className={cn(ESPACO_FIXO, 'bg-surface')} />
      <td className={cn(REALIZADO, 'bg-surface', LINHA)} />
      <td className={cn(PERCENTUAL, 'bg-surface', LINHA)} />
    </>
  )
}

function LinhaDaGrade(props: {
  linha: LinhaDre
  meses: string[]
  receitaLiquida: number
  aberto: boolean
  aoAlternar: () => void
  /** Link do valor de um mês, ou do período sem `mes`; vazio no que não abre lançamentos. */
  href: (mes?: string) => string | undefined
  escolhido: (mes?: string) => boolean
}) {
  const { linha, meses, receitaLiquida, aberto, aoAlternar, href, escolhido } = props
  const total = linha.tipo === 'total' || linha.id === RESULTADO_LIQUIDO
  const subtotal = linha.tipo === 'subtotal' && !total
  const fundo = total ? 'bg-brand-100' : subtotal ? 'bg-brand-50' : 'bg-surface'
  const borda = total ? LINHA_FORTE : LINHA
  const peso = total || subtotal ? 'font-semibold' : 'font-normal'
  // Só subtotal e total ficam vermelhos: despesa é negativa por natureza.
  const corDoValor = (valor: number) => ((subtotal || total) && Math.round(valor / 100) < 0 ? 'text-danger' : '')
  const rotulo = rotuloDaLinha(linha)

  return (
    <tr className={cn('text-right', peso)}>
      <th scope="row" className={cn(ROTULO_FIXO, fundo, peso, borda, subtotal && 'text-brand-700')}>
        <span className="flex flex-col items-start gap-x-2.5 gap-y-1 py-1.5 md:flex-row md:items-center">
          {linha.tipo === 'bloco' ? (
            <button type="button" onClick={aoAlternar} aria-expanded={aberto} className={BOTAO_DA_LINHA}>
              <span aria-hidden="true">{aberto ? '−' : '+'}</span>
              {aberto ? 'Fechar' : 'Abrir'}
              <span className="sr-only"> {rotulo}</span>
            </button>
          ) : (
            <span className="hidden w-[5.75rem] shrink-0 md:block" />
          )}
          <span className={cn(linha.bloco && 'pl-3 md:pl-4')}>{rotulo}</span>
        </span>
      </th>
      {meses.map((mes, i) => {
        const valor = linha.valores[i]
        return (
          <Fragment key={mes}>
            <td className={cn(ESPACO, fundo, total && LINHA_FORTE)} />
            <td className={cn('p-1', fundo, BORDA_DO_MES, borda)}>
              <Valor href={valor ? href(mes) : undefined} escolhido={escolhido(mes)} cor={corDoValor(valor)} titulo={`Ver o que forma ${formatarMes(mes)}`}>
                {numeroInteiro(valor)}
              </Valor>
            </td>
          </Fragment>
        )
      })}
      <td className={cn(ESPACO_FIXO, fundo, total && LINHA_FORTE)} />
      <td className={cn(REALIZADO, fundo, 'p-1 font-semibold', borda)}>
        <Valor href={linha.total ? href() : undefined} escolhido={escolhido()} cor={corDoValor(linha.total)} titulo="Ver o que forma o período">
          {numeroInteiro(linha.total)}
        </Valor>
      </td>
      <td className={cn(PERCENTUAL, fundo, 'px-3 py-1', borda)}>{receitaLiquida ? formatarPercentual(linha.total / receitaLiquida) : '—'}</td>
    </tr>
  )
}

export function TabelaDre({
  meses,
  linhas,
  receitaLiquida,
  rotuloDoPeriodo,
  consulta,
  selecao,
}: {
  meses: string[]
  linhas: LinhaDre[]
  receitaLiquida: number
  rotuloDoPeriodo: string
  consulta: string
  selecao?: SelecaoDre
}) {
  // A grade abre só com os blocos e os resultados; as contas abrem com um clique.
  const [abertos, setAbertos] = useState<Set<string>>(new Set())
  const [secoesFechadas, setSecoesFechadas] = useState<Set<string>>(new Set())
  const blocos = linhas.filter((linha) => linha.tipo === 'bloco').map((linha) => linha.id)
  const todosAbertos = blocos.length > 0 && blocos.every((id) => abertos.has(id))
  const alternar = (ids: Set<string>, id: string) => {
    const novos = new Set(ids)
    if (!novos.delete(id)) novos.add(id)
    return novos
  }

  const hrefDe = (linha: LinhaDre) => (mes?: string) => {
    if (linha.tipo !== 'conta' && linha.tipo !== 'bloco') return undefined
    const params = new URLSearchParams(consulta)
    // Clicar de novo no valor escolhido fecha o quadro de lançamentos.
    if (selecao?.linha === linha.id && selecao.mes === mes) return params.size ? `/financeiro/dre?${params}` : '/financeiro/dre'
    params.set('linha', linha.id)
    if (mes) params.set('mes', mes)
    return `/financeiro/dre?${params}`
  }

  return (
    <TabelaRolavel
      acoes={
        blocos.length > 0 && (
          <button type="button" onClick={() => setAbertos(todosAbertos ? new Set() : new Set(blocos))} className={classeBotao('secundario')}>
            {todosAbertos ? 'Fechar todas as linhas' : 'Abrir todas as linhas'}
          </button>
        )
      }
    >
      <table className="w-full min-w-max border-separate border-spacing-0 text-sm">
        <thead className="text-xs text-subtle">
          <tr className="whitespace-nowrap">
            <th scope="col" rowSpan={2} className={cn(ROTULO_FIXO, CABECALHO, 'py-3 align-bottom')}>
              Linha da DRE
            </th>
            {meses.map((mes) => (
              <Fragment key={mes}>
                <td rowSpan={2} className={cn(ESPACO, CABECALHO)} />
                <th data-mes scope="col" rowSpan={2} className={cn('min-w-[6.5rem] px-3.5 py-3 text-right align-bottom', BORDA_DO_MES, CABECALHO)}>
                  {formatarMes(mes)}
                </th>
              </Fragment>
            ))}
            <td data-espaco-fixo rowSpan={2} className={cn(ESPACO_FIXO, CABECALHO)} />
            <th scope="colgroup" colSpan={2} className={cn(FIXA, 'right-0 border-l-2 border-l-grade bg-painel px-3 pb-0.5 pt-3 text-right font-semibold text-ink')}>
              Período · {rotuloDoPeriodo}
            </th>
          </tr>
          <tr>
            <th scope="col" className={cn(REALIZADO, CABECALHO, 'px-3.5 pb-3 pt-0.5 text-right align-bottom text-ink')}>
              Realizado
            </th>
            <th scope="col" className={cn(PERCENTUAL, CABECALHO, 'px-2 pb-3 pt-0.5 text-right align-bottom leading-tight')}>
              % da receita líquida
            </th>
          </tr>
        </thead>
        <tbody>
          {linhas.map((linha) => {
            if (linha.tipo === 'secao') {
              const fechada = secoesFechadas.has(linha.id)
              return (
                <tr key={linha.id}>
                  <th scope="colgroup" className={cn(ROTULO_FIXO, 'bg-surface py-0.5 font-semibold', LINHA)}>
                    <button
                      type="button"
                      aria-expanded={!fechada}
                      onClick={() => setSecoesFechadas((atuais) => alternar(atuais, linha.id))}
                      className="flex min-h-12 w-full items-center gap-2 text-left text-xs font-semibold text-subtle hover:text-brand-700"
                    >
                      <span aria-hidden="true">{fechada ? '+' : '−'}</span>
                      {linha.nome}
                    </button>
                  </th>
                  <GradeVazia meses={meses} />
                </tr>
              )
            }
            if (linha.secao && secoesFechadas.has(linha.secao)) return null
            if (linha.bloco && !abertos.has(linha.bloco)) return null
            return (
              <LinhaDaGrade
                key={linha.id}
                linha={linha}
                meses={meses}
                receitaLiquida={receitaLiquida}
                aberto={abertos.has(linha.id)}
                aoAlternar={() => setAbertos((atuais) => alternar(atuais, linha.id))}
                href={hrefDe(linha)}
                escolhido={(mes) => selecao?.linha === linha.id && selecao.mes === mes}
              />
            )
          })}
        </tbody>
      </table>
    </TabelaRolavel>
  )
}

'use client'

import { ChevronRight } from 'lucide-react'
import Link from 'next/link'
import { Fragment, useState, type ReactNode } from 'react'
import { difDaMeta, rotuloDaLinha, type LinhaDre } from '@/domain/financeiro/dre'
import { cn } from '@/lib/cn'
import { somar } from '@/lib/dinheiro'
import { formatarMes, numeroInteiro, percentualComSinal } from '@/lib/formatar'
import { TabelaRolavel } from './tabela-rolavel'

export type SelecaoDre = { linha: string; mes?: string }

const COLUNAS = ['Meta', 'Realizado', 'Dif. %']

/**
 * Grade no estilo da planilha: cada mês é um bloco de três células, com linha forte nas bordas do bloco e suave por dentro,
 * e um espaço entre um bloco e outro. Bordas por lado, sem border-collapse, para as células travadas levarem as linhas ao rolar.
 */
const LINHA = 'border-b border-b-line'
const borda = (k: number) => cn(k === 0 && 'border-l border-l-grade', k === COLUNAS.length - 1 ? 'border-r border-r-grade' : 'border-r border-r-line')
const ESPACO = 'w-3.5 min-w-3.5 bg-surface p-0'

/** Bloco do período: travado à direita em tela larga. `DIREITA[n]` fica n colunas para dentro. */
const FIXA = 'z-10 lg:sticky'
const COLUNA_FIXA = 'w-24 min-w-24'
const DIREITA = ['right-0', 'right-24', 'right-48', 'right-72']
const direita = (k: number) => DIREITA[COLUNAS.length - 1 - k]

/** A coluna das contas leva consigo o espaço seguinte, para os meses não encostarem nela ao rolar. */
const ROTULO_FIXO = 'sticky left-0 z-10 shadow-[0.875rem_0_0_var(--color-surface)]'

const SELECIONADA = 'bg-rail outline-2 -outline-offset-2 outline-ink'

/** Resultados que fecham a conta: negrito mais forte, como a linha de total. */
const FORTES = new Set(['subtotal-despesa', 'subtotal-outras'])

function corDaDif(dif: number | null) {
  if (dif === null || Math.round(dif * 1000) === 0) return 'text-muted'
  return dif > 0 ? 'text-ok' : 'text-danger'
}

function Valor({ href, escolhido, cor, titulo, children }: { href?: string; escolhido: boolean; cor?: string; titulo: string; children: ReactNode }) {
  if (!href) return <span className={cn('block px-1 py-1.5', cor)}>{children}</span>
  return (
    <Link
      href={href}
      scroll={false}
      aria-current={escolhido || undefined}
      title={titulo}
      className={cn('block rounded px-1 py-1.5', cor, escolhido ? SELECIONADA : 'hover:bg-rail')}
    >
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
          <td className={ESPACO} />
          {COLUNAS.map((coluna, k) => (
            <td key={coluna} className={cn(borda(k), LINHA)} />
          ))}
        </Fragment>
      ))}
      <td className={cn(FIXA, DIREITA[3], ESPACO)} />
      {COLUNAS.map((coluna, k) => (
        <td key={coluna} className={cn(FIXA, direita(k), COLUNA_FIXA, 'bg-surface', borda(k), LINHA)} />
      ))}
    </>
  )
}

function LinhaDaGrade(props: {
  linha: LinhaDre
  meses: string[]
  aberto: boolean
  aoAlternar: () => void
  /** Link do valor de um mês, ou do período sem `mes`; vazio no que não abre lançamentos. */
  href: (mes?: string) => string | undefined
  escolhido: (mes?: string) => boolean
}) {
  const { linha, meses, aberto, aoAlternar, href, escolhido } = props
  const total = linha.tipo === 'total'
  const subtotal = linha.tipo === 'subtotal'
  const bloco = linha.tipo === 'bloco'
  const fundo = total ? 'bg-nav text-nav-ink' : subtotal ? 'bg-canvas' : 'bg-surface'
  const peso = total || FORTES.has(linha.id) ? 'font-bold' : subtotal || bloco || !linha.bloco ? 'font-semibold' : 'font-normal'
  const apagado = total ? 'text-nav-muted' : 'text-muted'
  // Só subtotal e total ficam vermelhos: despesa é negativa por natureza.
  const corDoValor = (valor: number) => ((subtotal || total) && Math.round(valor / 100) < 0 ? (total ? 'text-nav-danger' : 'text-danger') : '')
  const rotulo = rotuloDaLinha(linha)
  const metaDoPeriodo = linha.metas ? somar(linha.metas) : undefined
  const difDoPeriodo = difDaMeta(linha.total, metaDoPeriodo)

  return (
    <tr className={cn('text-right', fundo, peso)}>
      <th
        scope="row"
        className={cn('max-w-48 text-left lg:max-w-none lg:whitespace-nowrap', ROTULO_FIXO, fundo, peso, LINHA, linha.bloco ? 'pl-10' : 'pl-4', 'pr-4', bloco ? 'py-0' : 'py-2')}
      >
        {bloco ? (
          <button type="button" onClick={aoAlternar} aria-expanded={aberto} className="flex min-h-10 w-full items-center gap-1.5 text-left hover:text-brand-700">
            <ChevronRight className={cn('size-4 shrink-0 text-muted transition-transform', aberto && 'rotate-90')} />
            {rotulo}
          </button>
        ) : (
          rotulo
        )}
      </th>
      {meses.map((mes, i) => {
        const valor = linha.valores[i]
        const meta = linha.metas?.[i]
        const dif = difDaMeta(valor, meta)
        return (
          <Fragment key={mes}>
            <td className={ESPACO} />
            <td className={cn('px-2 py-2', apagado, borda(0), LINHA)}>{meta === undefined ? '—' : numeroInteiro(meta)}</td>
            <td className={cn('px-1 py-0.5', borda(1), LINHA)}>
              <Valor href={valor ? href(mes) : undefined} escolhido={escolhido(mes)} cor={corDoValor(valor)} titulo={`Ver o que forma ${formatarMes(mes)}`}>
                {numeroInteiro(valor)}
              </Valor>
            </td>
            <td className={cn('px-2 py-2', corDaDif(dif), borda(2), LINHA)}>{dif === null ? '' : percentualComSinal(dif)}</td>
          </Fragment>
        )
      })}
      <td className={cn(FIXA, DIREITA[3], ESPACO)} />
      <td className={cn(FIXA, direita(0), COLUNA_FIXA, fundo, 'px-2 py-2', apagado, borda(0), LINHA)}>{metaDoPeriodo === undefined ? '—' : numeroInteiro(metaDoPeriodo)}</td>
      <td className={cn(FIXA, direita(1), COLUNA_FIXA, fundo, 'px-1 py-0.5', borda(1), LINHA)}>
        <Valor href={linha.total ? href() : undefined} escolhido={escolhido()} cor={corDoValor(linha.total)} titulo="Ver o que forma o período">
          {numeroInteiro(linha.total)}
        </Valor>
      </td>
      <td className={cn(FIXA, direita(2), COLUNA_FIXA, fundo, 'px-2 py-2', corDaDif(difDoPeriodo), borda(2), LINHA)}>
        {difDoPeriodo === null ? '' : percentualComSinal(difDoPeriodo)}
      </td>
    </tr>
  )
}

export function TabelaDre({
  meses,
  linhas,
  rotuloDoPeriodo,
  consulta,
  selecao,
}: {
  meses: string[]
  linhas: LinhaDre[]
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
    <TabelaRolavel>
      <table className="w-full min-w-max border-separate border-spacing-0 text-xs tabular-nums">
        <thead>
          <tr className="whitespace-nowrap text-muted">
            <th scope="col" rowSpan={2} className={cn(ROTULO_FIXO, 'bg-surface px-4 py-2.5 text-left align-bottom font-medium', LINHA)}>
              <span className="flex items-center gap-2.5">
                Linha da DRE
                {blocos.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setAbertos(todosAbertos ? new Set() : new Set(blocos))}
                    className="rounded-md border border-line bg-surface px-2 py-0.5 font-medium text-ink transition-colors hover:border-brand-300 hover:bg-brand-50"
                  >
                    {todosAbertos ? 'Fechar tudo' : 'Abrir tudo'}
                  </button>
                )}
              </span>
            </th>
            {meses.map((mes) => (
              <Fragment key={mes}>
                <td className={ESPACO} />
                <th scope="colgroup" colSpan={COLUNAS.length} className="px-2 pb-1.5 pt-3 text-center font-medium">
                  {formatarMes(mes)}
                </th>
              </Fragment>
            ))}
            <td data-espaco-fixo className={cn(FIXA, DIREITA[3], ESPACO)} />
            <th scope="colgroup" colSpan={COLUNAS.length} className={cn(FIXA, 'right-0 bg-surface px-2 pb-1.5 pt-3 text-center font-medium text-ink')}>
              Período · {rotuloDoPeriodo}
            </th>
          </tr>
          <tr className="whitespace-nowrap text-muted">
            {meses.map((mes) => (
              <Fragment key={mes}>
                <td className={ESPACO} />
                {COLUNAS.map((coluna, k) => (
                  <th key={coluna} scope="col" className={cn('min-w-20 px-2 pb-2 pt-1.5 text-center font-medium', borda(k), LINHA)}>
                    {coluna}
                  </th>
                ))}
              </Fragment>
            ))}
            <td className={cn(FIXA, DIREITA[3], ESPACO)} />
            {COLUNAS.map((coluna, k) => (
              <th
                key={coluna}
                scope="col"
                className={cn(FIXA, direita(k), COLUNA_FIXA, 'bg-surface px-2 pb-2 pt-1.5 text-center font-medium', k === 1 && 'text-ink', borda(k), LINHA)}
              >
                {coluna}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {linhas.map((linha) => {
            if (linha.tipo === 'secao') {
              const fechada = secoesFechadas.has(linha.id)
              return (
                <tr key={linha.id}>
                  <th scope="colgroup" className={cn(ROTULO_FIXO, 'max-w-48 bg-surface px-4 pb-2 pt-3.5 text-left lg:max-w-none', LINHA)}>
                    <button
                      type="button"
                      aria-expanded={!fechada}
                      onClick={() => setSecoesFechadas((atuais) => alternar(atuais, linha.id))}
                      className="flex items-start gap-1.5 text-left font-medium text-muted hover:text-brand-700"
                    >
                      <ChevronRight className={cn('size-4 shrink-0 transition-transform', !fechada && 'rotate-90')} />
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

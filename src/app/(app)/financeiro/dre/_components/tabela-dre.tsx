'use client'

import { ChevronRight } from 'lucide-react'
import { useState } from 'react'
import type { LinhaDre } from '@/domain/financeiro/dre'
import { cn } from '@/lib/cn'
import { somar } from '@/lib/dinheiro'
import { brlInteiro, formatarMes, formatarPercentual } from '@/lib/formatar'

/** Grupos longos começam fechados, para a DRE caber na tela: só o total de cada um aparece. */
const FECHADOS_NO_INICIO = ['secao-custo', 'secao-despesa', 'secao-fora']

/** Cada conta pertence à seção acima dela; um subtotal fecha a seção. */
function comSecao(linhas: LinhaDre[]) {
  let secao: string | undefined
  return linhas.map((linha) => {
    if (linha.tipo === 'secao') secao = linha.id
    if (linha.tipo === 'subtotal') secao = undefined
    return { linha, secao: linha.tipo === 'conta' ? secao : undefined }
  })
}

export function TabelaDre({ meses, linhas, receitaLiquida }: { meses: string[]; linhas: LinhaDre[]; receitaLiquida: number }) {
  const [fechadas, setFechadas] = useState(() => new Set(FECHADOS_NO_INICIO))
  const itens = comSecao(linhas)
  const contasDa = (secao: string) => itens.filter((item) => item.secao === secao).map((item) => item.linha)
  const alternar = (secao: string) =>
    setFechadas((atuais) => {
      const novas = new Set(atuais)
      if (!novas.delete(secao)) novas.add(secao)
      return novas
    })

  const valoresDaLinha = (valores: number[], total: number, destaque: boolean) => (
    <>
      {valores.map((valor, i) => (
        <td key={meses[i]} className={cn('num', valor < 0 && destaque && 'text-danger', valor === 0 && 'text-subtle')}>
          {brlInteiro(valor)}
        </td>
      ))}
      <td className={cn('num font-semibold', total < 0 && destaque && 'text-danger')}>{brlInteiro(total)}</td>
      <td className="num text-muted">{receitaLiquida ? formatarPercentual(total / receitaLiquida) : '—'}</td>
    </>
  )

  return (
    <table className="tabela">
      <thead>
        <tr>
          <th className="sticky left-0 bg-surface">Conta</th>
          {meses.map((mes) => (
            <th key={mes} className="num">
              {formatarMes(mes)}
            </th>
          ))}
          <th className="num">Total</th>
          <th className="num">% receita líq.</th>
        </tr>
      </thead>
      <tbody>
        {itens.map(({ linha, secao }) => {
          if (secao && fechadas.has(secao)) return null
          if (linha.tipo === 'secao') {
            const contas = contasDa(linha.id)
            const aberta = !fechadas.has(linha.id)
            const valores = meses.map((_, i) => somar(contas.map((c) => c.valores[i])))
            return (
              <tr key={linha.id} className="bg-canvas">
                <td className="sticky left-0 min-w-56 whitespace-nowrap bg-canvas">
                  <button
                    type="button"
                    onClick={() => alternar(linha.id)}
                    aria-expanded={aberta}
                    title={`${contas.length} ${contas.length === 1 ? 'conta' : 'contas'}`}
                    className="flex items-center gap-1.5 font-medium text-ink hover:text-brand-700"
                  >
                    <ChevronRight className={cn('size-4 shrink-0 text-muted transition-transform', aberta && 'rotate-90')} />
                    {linha.nome}
                  </button>
                </td>
                {valoresDaLinha(valores, somar(contas.map((c) => c.total)), false)}
              </tr>
            )
          }
          const subtotal = linha.tipo === 'subtotal'
          return (
            <tr key={linha.id} className={cn(subtotal && 'bg-brand-50/60 font-semibold')}>
              <td className={cn('sticky left-0 min-w-56 whitespace-nowrap', subtotal ? 'bg-brand-50 text-brand-900' : 'bg-surface')}>
                {/* O recuo fica no span: o padding da primeira coluna vem do CSS da .tabela e ganha de classe. */}
                <span className={cn(secao && 'ml-6 inline-block text-muted')}>{linha.nome}</span>
              </td>
              {valoresDaLinha(linha.valores, linha.total, subtotal)}
            </tr>
          )
        })}
      </tbody>
    </table>
  )
}

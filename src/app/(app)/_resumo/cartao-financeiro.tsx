import { Icone } from '@/components/ui/icone'
import { LinkRapido } from '@/components/ui/link-rapido'
import { listarNotas, projecaoDeCaixa } from '@/data/financeiro'
import { resumoNotas } from '@/domain/financeiro/notas'
import { cn } from '@/lib/cn'
import type { DataISO } from '@/lib/datas'
import { brl, contar, formatarMes } from '@/lib/formatar'
import { CartaoResumo, Destaque } from './cartao'

const MESES_NO_GRAFICO = 6
const ALTURA_DA_BARRA = 100

/** Barra que cresce com o cartão: altura por flex-grow, porque % não pega a altura de um pai flexível. */
function Barra({ percentual, className }: { percentual: number; className: string }) {
  return (
    <div className="flex w-2.5 flex-col">
      <div style={{ flexGrow: 100 - percentual, flexBasis: 0 }} />
      <div className={`rounded-t-[3px] ${className}`} style={{ flexGrow: percentual, flexBasis: 0 }} />
    </div>
  )
}

/**
 * A receber (em dia × atrasado) e o que entrou e saiu da conta nos últimos 6 meses fechados.
 * Verde é dinheiro entrando, vermelho é saída ou atraso (17/11: o cartão todo vermelho parecia prejuízo).
 */
export async function CartaoFinanceiro({ dia }: { dia: DataISO }) {
  const [{ notas }, { mesAMes }] = await Promise.all([listarNotas(), projecaoDeCaixa()])
  const geral = resumoNotas(
    notas.map(({ nota }) => nota),
    dia,
  )
  const emDia = geral.aReceber - geral.atrasado

  // Os meses fechados do Fluxo de caixa (extrato da conta).
  const grafico = mesAMes
    .filter((m) => m.tipo === 'realizado')
    .slice(-MESES_NO_GRAFICO)
    .map((m) => ({ mes: formatarMes(m.mes).split('/')[0], entradas: m.entradas, saidas: -m.saidas }))
  const maior = Math.max(1, ...grafico.flatMap((g) => [g.entradas, g.saidas]))
  const altura = (valor: number) => Math.round((valor / maior) * ALTURA_DA_BARRA)

  return (
    <CartaoResumo icone="account_balance_wallet" titulo="Financeiro" href="/financeiro" tom="verde">
      <Destaque icone="payments" rotulo="A receber" valor={brl(geral.aReceber)} />

      {geral.aReceber > 0 && (
        <div role="img" aria-label={`Do valor a receber, ${brl(emDia)} estão em dia e ${brl(geral.atrasado)} estão atrasados`} className="flex h-2.5 gap-0.5 overflow-hidden rounded-[5px]">
          <span className="bg-brand-500" style={{ flexGrow: emDia }} />
          <span className="bg-danger" style={{ flexGrow: geral.atrasado }} />
        </div>
      )}

      <div className="flex flex-col gap-1 text-[0.84375rem]">
        <div className="flex flex-wrap justify-between gap-x-2">
          <span className="flex items-center gap-1.5">
            <Icone nome="check_circle" cheio className="text-[1.0625rem] text-brand-500" />
            Em dia
          </span>
          <span className="font-semibold">{brl(emDia)}</span>
        </div>
        <LinkRapido href="/financeiro?aba=atrasadas" className={cn('flex flex-wrap justify-between gap-x-2 hover:underline', geral.atrasado > 0 ? 'text-danger' : 'text-muted')}>
          <span className="flex items-center gap-1.5">
            <Icone nome="warning" cheio className="text-[1.0625rem]" />
            Atrasado · {contar(geral.quantidadeAtrasadas, 'nota', 'notas')}
          </span>
          <span className="font-semibold">{brl(geral.atrasado)}</span>
        </LinkRapido>
      </div>

      <div className="flex flex-1 flex-col gap-2 border-t border-line pt-3">
        <div className="flex flex-wrap justify-between gap-x-3 gap-y-1 text-xs text-muted">
          <LinkRapido href="/financeiro/fluxo" className="flex items-center gap-1.5 hover:underline">
            <Icone nome="bar_chart" className="text-[1.0625rem] text-brand-700" />
            Entradas × saídas por mês
          </LinkRapido>
          <span className="flex gap-2.5">
            <span className="flex items-center gap-1">
              <span className="size-2 rounded-[2px] bg-brand-500" />
              Entradas
            </span>
            <span className="flex items-center gap-1">
              <span className="size-2 rounded-[2px] bg-danger" />
              Saídas
            </span>
          </span>
        </div>
        <div className="flex min-h-[120px] flex-1 items-stretch gap-2.5">
          {grafico.map(({ mes, entradas, saidas }) => (
            <div key={mes} role="img" aria-label={`${mes}: entraram ${brl(entradas)}, saíram ${brl(saidas)}`} className="flex min-w-0 flex-1 flex-col items-center gap-1.5">
              <div className="flex flex-1 gap-[3px]">
                <Barra percentual={altura(entradas)} className="bg-brand-500" />
                <Barra percentual={altura(saidas)} className="bg-danger" />
              </div>
              <span className="text-[0.71875rem] text-subtle">{mes}</span>
            </div>
          ))}
        </div>
      </div>
    </CartaoResumo>
  )
}

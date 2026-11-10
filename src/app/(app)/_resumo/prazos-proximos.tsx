import { Icone, type NomeIcone } from '@/components/ui/icone'
import { listarPrazos } from '@/data/processos'
import { estaAberto } from '@/domain/prazos'
import { somarDias, type DataISO } from '@/lib/datas'
import { cn } from '@/lib/cn'
import { contar, formatarDiaEData } from '@/lib/formatar'
import { CartaoResumo } from './cartao'

const DIAS_ANTES = 6
const DIAS_DEPOIS = 14
/** Altura da barra mais alta, em % da coluna (o gráfico cresce com o cartão). Com poucos prazos, a escala para em 3 para um prazo só não virar uma torre. */
const ALTURA_MAXIMA = 80
const ESCALA_MINIMA = 3

function Contador({ icone, numero, rotulo, tom }: { icone: NomeIcone; numero: number; rotulo: string; tom: 'alerta' | 'semana' | 'mes' }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="flex items-center gap-2">
        <span
          className={cn(
            'inline-flex size-[30px] items-center justify-center rounded-lg',
            tom === 'alerta' ? 'bg-warn-soft text-warn' : tom === 'semana' ? 'bg-brand-100 text-ink' : 'bg-painel text-ink',
          )}
        >
          <Icone nome={icone} cheio className="text-lg" />
        </span>
        <span className={cn('text-[1.75rem] font-semibold leading-[1.1]', tom === 'alerta' ? 'text-warn' : 'text-ink')}>{numero}</span>
      </span>
      <span className="text-[0.8125rem] text-muted">{rotulo}</span>
    </div>
  )
}

/** Cartão do Resumo: quantos prazos vêm por aí e um gráfico de barras por dia, de uma semana atrás a duas semanas à frente. */
export async function PrazosProximos({ dia }: { dia: DataISO }) {
  const prazos = await listarPrazos()
  // Só as obrigações da Eco Direito, como no bloco de vencidos.
  const abertos = prazos.filter((p) => p.regra.tipo !== 'expectativa' && estaAberto(p, dia))
  const entre = (de: DataISO, ate: DataISO) => abertos.filter((p) => p.vencimento >= de && p.vencimento <= ate).length

  const amanha = somarDias(dia, 1)
  const doisDias = somarDias(dia, 2)
  const colunas = Array.from({ length: DIAS_ANTES + DIAS_DEPOIS + 1 }, (_, i) => {
    const data = somarDias(dia, i - DIAS_ANTES)
    return { data, quantidade: entre(data, data) }
  })
  const escala = Math.max(ESCALA_MINIMA, ...colunas.map((c) => c.quantidade))

  return (
    <CartaoResumo icone="calendar_month" titulo="Prazos nas próximas duas semanas" href="/prazos" acao="Ver prazos">
      <div className="flex flex-wrap gap-x-7 gap-y-3">
        <Contador icone="alarm" numero={entre(amanha, amanha)} rotulo="vence amanhã" tom="alerta" />
        <Contador icone="date_range" numero={entre(dia, somarDias(dia, 7))} rotulo="nos próximos 7 dias" tom="semana" />
        <Contador icone="calendar_month" numero={entre(dia, somarDias(dia, 30))} rotulo="nos próximos 30 dias" tom="mes" />
      </div>

      {/* No celular, as 21 colunas não cabem: o gráfico rola de lado dentro do cartão. */}
      <div className="-mx-1 flex flex-1 flex-col overflow-x-auto px-1">
        <div className="flex min-h-[150px] min-w-[24rem] flex-1 items-stretch gap-1">
          {colunas.map(({ data, quantidade }) => {
            const ehHoje = data === dia
            const cor = data < dia ? 'danger' : data <= doisDias ? 'accent' : 'brand'
            const legenda = `${ehHoje ? 'Hoje, ' : ''}${formatarDiaEData(data)}: ${quantidade ? contar(quantidade, 'prazo', 'prazos') : 'nenhum prazo'}`
            return (
              <div
                key={data}
                role="img"
                aria-label={legenda}
                title={legenda}
                className={cn('flex min-w-0 flex-1 flex-col gap-1.5 rounded-md px-px py-1', ehHoje && 'bg-brand-50')}
              >
                <div aria-hidden className="flex flex-1 flex-col items-center justify-end gap-[3px]">
                  {quantidade > 0 ? (
                    <>
                      {/* Altura por flex-grow, não por %: a coluna cresce com o cartão e % não pega altura de pai flexível. */}
                      <div style={{ flexGrow: 100 - Math.round((quantidade / escala) * ALTURA_MAXIMA), flexBasis: 0 }} />
                      <span className={cn('text-xs font-bold', cor === 'danger' ? 'text-danger' : cor === 'accent' ? 'text-accent' : 'text-brand-500')}>{quantidade}</span>
                      <div
                        className={cn('min-h-1 w-[70%] rounded', cor === 'danger' ? 'bg-danger' : cor === 'accent' ? 'bg-accent' : 'bg-brand-500')}
                        style={{ flexGrow: Math.round((quantidade / escala) * ALTURA_MAXIMA), flexBasis: 0 }}
                      />
                    </>
                  ) : (
                    <div className="h-[3px] w-[70%] rounded bg-line" />
                  )}
                </div>
                <span
                  aria-hidden
                  className={cn(
                    'text-center text-[0.71875rem] tabular-nums',
                    ehHoje ? 'font-bold text-ink' : data < dia ? 'font-medium text-danger' : 'font-medium text-ink/50',
                  )}
                >
                  {ehHoje ? 'Hoje' : Number(data.slice(8, 10))}
                </span>
              </div>
            )
          })}
        </div>
      </div>

      <ul className="flex flex-wrap gap-x-4 gap-y-1 text-[0.78125rem] text-muted">
        <li className="flex items-center gap-1.5">
          <Icone nome="error" cheio className="text-[0.9375rem] leading-none text-danger" />
          Vencido
        </li>
        <li className="flex items-center gap-1.5">
          <Icone nome="warning" cheio className="text-[0.9375rem] leading-none text-accent" />
          Vence em até 2 dias
        </li>
        <li className="flex items-center gap-1.5">
          <Icone nome="event_available" cheio className="text-[0.9375rem] leading-none text-brand-500" />
          Mais adiante
        </li>
      </ul>
    </CartaoResumo>
  )
}

import { cn } from '@/lib/cn'
import { LinkRapido } from './link-rapido'

const FUNDOS = {
  verde: 'bg-brand-50',
  amarelo: 'bg-warn-soft',
  vermelho: 'bg-danger-soft',
  neutro: 'bg-apagado',
} as const

export type Aba = {
  valor: string
  rotulo: string
  href: string
  contagem?: number
  /** Valor em reais (no Faturamento). Com ele, as abas viram quadros em grade. */
  detalhe?: string
  /** Segunda linha do quadro: "15 notas". */
  legenda?: string
  /** Pinta o quadro de vermelho: o que está atrasado. */
  alerta?: boolean
  fundo?: keyof typeof FUNDOS
}

/** Abas de seção da página, na URL (`?aba=`). A ativa fica preenchida de verde. */
export function Abas({ abas, ativa, className }: { abas: Aba[]; ativa: string; className?: string }) {
  if (abas.some((aba) => aba.detalhe)) return <AbasEmQuadros abas={abas} ativa={ativa} className={className} />
  return (
    <nav className={cn('mb-7 flex flex-wrap gap-2 rounded-lg bg-rail p-1.5 print:hidden', className)}>
      {abas.map((aba) => (
        <LinkRapido
          key={aba.valor}
          href={aba.href}
          scroll={false}
          aria-current={aba.valor === ativa ? 'page' : undefined}
          className={cn(
            'inline-flex min-h-13 items-center whitespace-nowrap rounded-md px-4.5 text-base font-medium transition-colors',
            aba.valor === ativa ? 'bg-brand-700 text-on-brand' : 'text-brand-700 hover:bg-brand-100',
          )}
        >
          {aba.rotulo}
          {aba.contagem !== undefined && <span className="ml-1.5">({aba.contagem})</span>}
        </LinkRapido>
      ))}
    </nav>
  )
}

function AbasEmQuadros({ abas, ativa, className }: { abas: Aba[]; ativa: string; className?: string }) {
  return (
    <nav className={cn('mb-7 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3 print:hidden', className)}>
      {abas.map((aba) => {
        const ligada = aba.valor === ativa
        return (
          <LinkRapido
            key={aba.valor}
            href={aba.href}
            scroll={false}
            aria-current={ligada ? 'page' : undefined}
            className={cn(
              'grid min-h-19 grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-0.5 rounded-lg px-4.5 py-3 transition-colors',
              ligada ? 'bg-brand-700 text-on-brand' : cn(FUNDOS[aba.fundo ?? 'neutro'], 'text-ink hover:ring-2 hover:ring-brand-700'),
            )}
          >
            <span className={cn('text-base font-semibold', !ligada && aba.alerta && 'text-danger')}>{aba.rotulo}</span>
            <span className={cn('col-start-2 row-span-2 row-start-1 text-right text-[1.25rem] font-semibold', !ligada && aba.alerta && 'text-danger')}>{aba.detalhe}</span>
            {(aba.legenda ?? aba.contagem !== undefined) && <span className={cn('text-xs', !ligada && 'text-muted')}>{aba.legenda ?? aba.contagem}</span>}
          </LinkRapido>
        )
      })}
    </nav>
  )
}

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
    <nav className={cn('mb-4 flex flex-wrap gap-1 rounded-lg bg-rail p-1 print:hidden', className)}>
      {abas.map((aba) => (
        <LinkRapido
          key={aba.valor}
          href={aba.href}
          scroll={false}
          aria-current={aba.valor === ativa ? 'page' : undefined}
          className={cn(
            'inline-flex min-h-8 items-center whitespace-nowrap rounded-md px-3 text-sm font-medium transition-colors pointer-coarse:min-h-10',
            aba.valor === ativa ? 'bg-brand-700 text-on-brand' : 'text-brand-700 hover:bg-brand-100',
          )}
        >
          {aba.rotulo}
          {aba.contagem !== undefined && <span className="ml-1">({aba.contagem})</span>}
        </LinkRapido>
      ))}
    </nav>
  )
}

/** Quadros do ciclo, todos numa fileira quando cabem: nome e quantidade em cima, valor embaixo. */
function AbasEmQuadros({ abas, ativa, className }: { abas: Aba[]; ativa: string; className?: string }) {
  return (
    <nav className={cn('mb-4 grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-6 print:hidden', className)}>
      {abas.map((aba) => {
        const ligada = aba.valor === ativa
        return (
          <LinkRapido
            key={aba.valor}
            href={aba.href}
            scroll={false}
            aria-current={ligada ? 'page' : undefined}
            className={cn(
              'block rounded-lg px-3 py-1.5 transition-colors',
              ligada ? 'copa text-white' : cn(FUNDOS[aba.fundo ?? 'neutro'], 'text-ink transition hover:-translate-y-px hover:shadow-[0_6px_14px_-10px_rgb(18_61_23/0.5)] motion-reduce:hover:translate-y-0'),
            )}
          >
            <span className="flex flex-wrap items-baseline justify-between gap-x-2">
              <span className={cn('text-sm font-medium', !ligada && aba.alerta && 'text-danger')}>{aba.rotulo}</span>
              {(aba.legenda ?? aba.contagem !== undefined) && <span className={cn('text-2xs', !ligada && 'text-muted')}>{aba.legenda ?? aba.contagem}</span>}
            </span>
            <span className={cn('block text-lg font-semibold', !ligada && aba.alerta && 'text-danger')}>{aba.detalhe}</span>
          </LinkRapido>
        )
      })}
    </nav>
  )
}

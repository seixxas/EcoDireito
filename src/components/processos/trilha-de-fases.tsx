import type { ReactNode } from 'react'
import { LinkRapido } from '@/components/ui/link-rapido'
import { cn } from '@/lib/cn'

export type FaseDaTrilha = {
  numero: number
  nome: string
  estado: 'feita' | 'atual' | 'futura'
  /** Texto embaixo do nome. Sem ele: "Concluída", "Fase atual" ou "A seguir". */
  legenda?: ReactNode
  /** Com endereço, a fase vira link (a aba Etapas abre nela). */
  href?: string
  /** O que a fase é, ao parar o mouse em cima do link. */
  dica?: string
  /** A fase aberta na tela. */
  selecionada?: boolean
}

const LEGENDA = { feita: 'Concluída', atual: 'Fase atual', futura: 'A seguir' } as const

/** A copa (gradiente da marca) no claro; no escuro, os verdes claros de sempre, que aparecem sobre o fundo escuro. */
const CRESCIDA = 'copa dark:bg-none dark:bg-brand-700'
const CRESCENDO = 'copa dark:bg-none dark:bg-brand-500'

/** A trilha cresce como planta: o que foi feito é copa, a fase atual está pela metade com um broto na ponta, o resto é terreno claro. */
function Barra({ estado }: { estado: FaseDaTrilha['estado'] }) {
  if (estado !== 'atual') return <span className={cn('block h-1.5 rounded-full', estado === 'feita' ? CRESCIDA : 'bg-line')} />
  return (
    <span className="relative block h-1.5 rounded-full bg-line">
      <span className={cn('absolute inset-y-0 left-0 w-[55%] rounded-full', CRESCENDO)} />
      <svg viewBox="0 0 24 24" className="absolute bottom-0.5 left-[calc(55%-3px)] size-3.5 text-brand-500" aria-hidden>
        <path d="M4 20C4 11 10 5 20 4C20 13.5 14 20 4 20Z" fill="currentColor" />
        <path d="M3 21L14.5 9.5" className="stroke-brand-50" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
    </span>
  )
}

function Fase({ numero, nome, estado, legenda, selecionada }: FaseDaTrilha) {
  return (
    <>
      <Barra estado={estado} />
      <span className={cn('block text-xs leading-tight text-ink', estado === 'atual' ? 'font-semibold' : 'font-medium', selecionada && 'underline decoration-1 underline-offset-2')}>
        <span className="sr-only">{numero}. </span>
        {nome}
      </span>
      <span className={cn('block text-2xs leading-tight', estado === 'atual' && !legenda ? 'font-semibold text-brand-700' : 'text-subtle')}>{legenda ?? LEGENDA[estado]}</span>
    </>
  )
}

/** As 8 fases do projeto numa barra só: a feita preenchida, a atual crescendo, a seguir apagada. Em tela estreita, quebra em duas fileiras. */
export function TrilhaDeFases({ fases }: { fases: FaseDaTrilha[] }) {
  return (
    <div className="@container">
      <ol className="grid grid-cols-2 gap-x-1 gap-y-2 @[24rem]:grid-cols-4 @[44rem]:grid-cols-8">
        {fases.map((fase) => (
          <li key={fase.numero} className="min-w-0">
            {fase.href ? (
              <LinkRapido
                href={fase.href}
                scroll={false}
                title={fase.dica}
                aria-current={fase.selecionada ? 'true' : undefined}
                className={cn('flex flex-col gap-1 rounded-sm px-1 py-1 hover:bg-brand-100', fase.selecionada && 'bg-brand-100')}
              >
                <Fase {...fase} />
              </LinkRapido>
            ) : (
              <div className="flex flex-col gap-1 px-1 py-1">
                <Fase {...fase} />
              </div>
            )}
          </li>
        ))}
      </ol>
    </div>
  )
}

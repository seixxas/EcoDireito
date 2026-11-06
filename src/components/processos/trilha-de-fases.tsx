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
  /** A fase aberta na tela, quando não é a atual. */
  selecionada?: boolean
}

const LEGENDA = { feita: 'Concluída', atual: 'Fase atual', futura: 'A seguir' } as const

function Fase({ numero, nome, estado, legenda, selecionada }: FaseDaTrilha) {
  return (
    <>
      <span
        className={cn(
          'block rounded-md border-2',
          estado === 'atual' ? '-mt-[5px] h-6.5 border-brand-500 bg-brand-500' : 'h-4 border-brand-700',
          estado === 'feita' && 'bg-brand-700',
          estado === 'futura' && 'bg-surface',
        )}
      />
      <span className={cn('block text-2xs font-medium leading-tight text-ink', estado === 'atual' && 'font-semibold', selecionada && 'underline decoration-2 underline-offset-3')}>
        <span className="sr-only">{numero}. </span>
        {nome}
      </span>
      <span className={cn('self-start text-2xs font-medium leading-snug text-subtle', estado === 'atual' && !legenda && 'rounded-sm bg-brand-700 px-2 py-px text-on-brand')}>{legenda ?? LEGENDA[estado]}</span>
    </>
  )
}

/** As 8 fases do projeto: a feita preenchida, a atual maior, a seguir só com a borda. Em tela estreita, quebra em duas fileiras. */
export function TrilhaDeFases({ fases }: { fases: FaseDaTrilha[] }) {
  return (
    <div className="@container">
      <ol className="grid grid-cols-2 gap-x-1.5 gap-y-5 @[32rem]:grid-cols-4 @[59rem]:grid-cols-8">
        {fases.map((fase) => (
          <li key={fase.numero} className="min-w-0">
            {fase.href ? (
              <LinkRapido href={fase.href} scroll={false} aria-current={fase.selecionada ? 'true' : undefined} className="flex min-h-12 flex-col gap-2 rounded-md hover:bg-brand-100">
                <Fase {...fase} />
              </LinkRapido>
            ) : (
              <div className="flex flex-col gap-2">
                <Fase {...fase} />
              </div>
            )}
          </li>
        ))}
      </ol>
    </div>
  )
}

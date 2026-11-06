import { cn } from '@/lib/cn'
import { FASES, type NumeroFase } from '@/domain/processos'

/** A barra pequena das 8 fases, na lista de projetos. */
export function FaseProgresso({ fase, legenda = true }: { fase: NumeroFase; legenda?: boolean }) {
  return (
    <div className="min-w-44">
      <div className="grid grid-cols-8 gap-[3px]">
        {FASES.map((f) => (
          <span
            key={f.numero}
            title={f.nome}
            className={cn('h-2.5 rounded-[3px]', f.numero < fase ? 'bg-brand-700' : f.numero === fase ? 'bg-brand-500 outline-2 outline-offset-1 outline-brand-700' : 'bg-line')}
          />
        ))}
      </div>
      {legenda && (
        <p className="mt-1.5 text-xs font-medium leading-tight">
          Fase {fase} de {FASES.length} · {FASES[fase - 1].nome}
        </p>
      )}
    </div>
  )
}

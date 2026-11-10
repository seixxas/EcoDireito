import { cn } from '@/lib/cn'
import { FASES, type NumeroFase } from '@/domain/processos'

/** A barra pequena das 8 fases, na lista de projetos. O que foi feito é copa (o gradiente da marca), como na `TrilhaDeFases`. */
export function FaseProgresso({ fase, legenda = true }: { fase: NumeroFase; legenda?: boolean }) {
  return (
    <div className="min-w-36">
      <div className="grid grid-cols-8 gap-[3px]">
        {FASES.map((f) => (
          <span
            key={f.numero}
            title={f.nome}
            className={cn(
              'h-1.5 rounded-full',
              f.numero < fase ? 'copa dark:bg-none dark:bg-brand-700' : f.numero === fase ? 'bg-brand-500 outline-1 outline-offset-1 outline-brand-500' : 'bg-line',
            )}
          />
        ))}
      </div>
      {legenda && (
        <p className="mt-1 text-xs leading-tight text-muted">
          Fase {fase} de {FASES.length} · {FASES[fase - 1].nome}
        </p>
      )}
    </div>
  )
}

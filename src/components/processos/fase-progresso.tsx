import { cn } from '@/lib/cn'
import { FASES, type NumeroFase } from '@/domain/processos'

export function FaseProgresso({ fase, legenda = true }: { fase: NumeroFase; legenda?: boolean }) {
  return (
    <div className="min-w-36">
      <div className="flex gap-1">
        {FASES.map((f) => (
          <span
            key={f.numero}
            title={f.nome}
            className={cn('h-2 flex-1 rounded-full', f.numero < fase ? 'bg-ok' : f.numero === fase ? 'bg-accent' : 'bg-line')}
          />
        ))}
      </div>
      {legenda && (
        <p className="mt-1.5 text-xs font-medium text-muted">
          Fase {fase} de 7 · {FASES[fase - 1].nome}
        </p>
      )}
    </div>
  )
}

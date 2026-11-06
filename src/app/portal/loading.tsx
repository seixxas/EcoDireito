import { PaginaDoPortal } from './_components/topo'

/** Espera da lista de projetos do cliente. */
export default function Carregando() {
  return (
    <PaginaDoPortal comSair={false}>
      <div className="animate-pulse">
        <div className="h-14 w-72 max-w-full rounded-md bg-line" />
        <div className="mt-3 h-7 w-[32rem] max-w-full rounded bg-line/70" />
        <div className="mt-13 space-y-2 rounded-xl bg-painel p-3.5">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-5 rounded-lg bg-surface p-4">
              <div className="min-w-0 flex-1">
                <div className="h-7 w-64 max-w-full rounded bg-line/80" />
                <div className="mt-2 h-6 w-96 max-w-full rounded bg-line/60" />
              </div>
              <div className="h-13 w-24 shrink-0 rounded-md bg-line/80" />
            </div>
          ))}
        </div>
      </div>
    </PaginaDoPortal>
  )
}

import { FASES } from '@/domain/processos'
import { PaginaDoPortal } from '../_components/topo'

/** Espera do acompanhamento: o nome do projeto, a trilha de fases e os dois blocos. */
export default function Carregando() {
  return (
    <PaginaDoPortal comSair={false}>
      <div className="animate-pulse">
        <div className="h-7 w-32 rounded bg-line/70" />
        <div className="mt-2 h-14 w-[36rem] max-w-full rounded-md bg-line" />
        <div className="mt-3 h-7 w-[28rem] max-w-full rounded bg-line/70" />
        <div className="mt-10 rounded-xl bg-brand-50 p-5 sm:p-7">
          <div className="h-6 w-28 rounded bg-line/70" />
          <div className="mt-2 h-10 w-[30rem] max-w-full rounded bg-line" />
          <div className="mt-6 grid grid-cols-2 gap-x-1.5 gap-y-5 sm:grid-cols-4 lg:grid-cols-8">
            {FASES.map((fase) => (
              <div key={fase.numero}>
                <div className="h-4 rounded-md bg-line" />
                <div className="mt-2 h-5 rounded bg-line/70" />
                <div className="mt-2 h-5 w-3/4 rounded bg-line/60" />
              </div>
            ))}
          </div>
        </div>
        <div className="mt-6 grid gap-6 md:grid-cols-2">
          {[1, 2].map((i) => (
            <div key={i} className="rounded-xl bg-painel px-5 py-6.5 sm:px-7">
              <div className="h-6 w-40 max-w-full rounded bg-line/70" />
              <div className="mt-2 h-11 w-64 max-w-full rounded bg-line" />
              <div className="mt-3 h-6 w-48 max-w-full rounded bg-line/60" />
            </div>
          ))}
        </div>
      </div>
    </PaginaDoPortal>
  )
}

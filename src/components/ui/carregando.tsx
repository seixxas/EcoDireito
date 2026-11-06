/** Esqueleto mostrado enquanto a página carrega (usado nos loading.tsx). */
export function Carregando() {
  return (
    <div className="animate-pulse">
      <div className="h-14 w-72 max-w-full rounded-md bg-line" />
      <div className="mt-2 h-6 w-[30rem] max-w-full rounded bg-line/70" />
      <div className="mt-5 space-y-1.5 rounded-xl bg-painel p-2">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="flex items-center gap-3 rounded-lg bg-surface px-3 py-4">
            <div className="h-5 w-24 rounded bg-line/80" />
            <div className="h-5 flex-1 rounded bg-line/60" />
            <div className="h-5 w-20 rounded bg-line/80" />
          </div>
        ))}
      </div>
    </div>
  )
}

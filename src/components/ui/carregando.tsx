/** Esqueleto mostrado enquanto a página carrega (usado nos loading.tsx). */
export function Carregando() {
  return (
    <div className="animate-pulse">
      <div className="h-8 w-56 rounded-md bg-line" />
      <div className="mt-2 h-4 w-96 max-w-full rounded bg-line/70" />
      <div className="mt-8 divide-y divide-line border-y border-line">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="flex items-center gap-4 py-3.5">
            <div className="h-4 w-20 rounded bg-line/80" />
            <div className="h-4 flex-1 rounded bg-line/60" />
            <div className="h-4 w-16 rounded bg-line/80" />
          </div>
        ))}
      </div>
    </div>
  )
}

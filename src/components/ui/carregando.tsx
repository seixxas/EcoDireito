/** Esqueleto mostrado enquanto a página carrega (usado nos loading.tsx). */
export function Carregando() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="h-9 w-64 rounded-lg bg-line" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-24 rounded-2xl bg-line/70" />
        ))}
      </div>
      <div className="h-80 rounded-2xl bg-line/60" />
    </div>
  )
}

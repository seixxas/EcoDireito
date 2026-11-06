/** Espera do login: a faixa verde vem do layout; aqui, o formulário em branco. */
export default function Carregando() {
  return (
    <div className="animate-pulse">
      <div className="h-13 w-44 max-w-full rounded-md bg-line" />
      <div className="mb-5 mt-2 h-7 w-full rounded bg-line/70" />
      {[1, 2].map((i) => (
        <div key={i} className="mb-4">
          <div className="h-6 w-24 rounded bg-line/70" />
          <div className="mt-1.5 h-15 rounded-md bg-line/60" />
        </div>
      ))}
      <div className="h-16 rounded-md bg-line/80" />
    </div>
  )
}

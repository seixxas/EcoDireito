/** Lista vazia do extrato: moldura tracejada, o que aconteceu e o que fazer. */
export function CaixaVazia({ titulo, detalhe }: { titulo: string; detalhe?: string }) {
  return (
    <div className="rounded-xl border border-dashed border-brand-300 px-4 py-6 text-center">
      <p className="text-lg font-medium text-ink">{titulo}</p>
      {detalhe && <p className="mt-1 text-muted">{detalhe}</p>}
    </div>
  )
}

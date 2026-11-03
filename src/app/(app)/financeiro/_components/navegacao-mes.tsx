import { ChevronLeft, ChevronRight, type LucideIcon } from 'lucide-react'
import Link from 'next/link'
import { formatarMes } from '@/lib/formatar'

/** Valor de `?mes=` para o histórico inteiro (útil com busca: "todas as notas do cliente X"). */
export const TODOS_OS_MESES = 'todos'

/**
 * ‹ out/26 ›: anda pelos meses do histórico. O mês vive na URL (`?mes=`), quem usa monta o link.
 * Com `todos`, oferece também o histórico inteiro (`href(TODOS_OS_MESES)`).
 */
export function NavegacaoMes({ mes, meses, href, todos }: { mes: string; meses: string[]; href: (mes: string) => string; todos?: boolean }) {
  if (mes === TODOS_OS_MESES) {
    return (
      <nav aria-label="Mês" className="inline-flex items-center gap-3 text-sm">
        <span className="font-medium text-ink">Todos os meses</span>
        <Link href={href(meses.at(-1)!)} scroll={false} className="link">
          por mês
        </Link>
      </nav>
    )
  }

  const i = meses.indexOf(mes)
  const seta = (alvo: string | undefined, rotulo: string, Icone: LucideIcon) =>
    alvo ? (
      <Link href={href(alvo)} scroll={false} aria-label={rotulo} title={rotulo} className="rounded-md p-1.5 text-muted hover:bg-surface hover:text-ink">
        <Icone className="size-4" />
      </Link>
    ) : (
      <span className="p-1.5 text-line">
        <Icone className="size-4" />
      </span>
    )

  return (
    <nav aria-label="Mês" className="inline-flex items-center">
      {seta(meses[i - 1], 'Mês anterior', ChevronLeft)}
      <span className="min-w-16 text-center text-sm font-medium tabular-nums text-ink">{formatarMes(mes)}</span>
      {seta(meses[i + 1], 'Próximo mês', ChevronRight)}
      {todos && (
        <Link href={href(TODOS_OS_MESES)} scroll={false} className="link ml-2 whitespace-nowrap text-sm">
          {/* No celular, ao lado do botão "Registrar nota", o texto inteiro não cabe. */}
          todos<span className="hidden sm:inline"> os meses</span>
        </Link>
      )}
    </nav>
  )
}

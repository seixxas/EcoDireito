import { ChevronLeft, ChevronRight, type LucideIcon } from 'lucide-react'
import Link from 'next/link'
import { formatarMes } from '@/lib/formatar'

/** ‹ out/26 ›: anda pelos meses do histórico. O mês vive na URL (`?mes=`), quem usa monta o link. */
export function NavegacaoMes({ mes, meses, href }: { mes: string; meses: string[]; href: (mes: string) => string }) {
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
    </nav>
  )
}

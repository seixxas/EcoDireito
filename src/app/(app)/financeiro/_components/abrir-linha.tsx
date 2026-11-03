import { ChevronRight } from 'lucide-react'
import Link from 'next/link'

/** Setinha no fim da linha da tabela: mostra que a linha abre o detalhe. */
export function AbrirLinha({ href, rotulo }: { href: string; rotulo: string }) {
  return (
    <td className="w-8 pl-0 text-right">
      <Link href={href} aria-label={rotulo} title={rotulo} className="inline-flex rounded-md p-1 text-muted hover:bg-rail hover:text-brand-700">
        <ChevronRight className="size-4" />
      </Link>
    </td>
  )
}

import { ChevronRight } from 'lucide-react'
import { LinkRapido } from '@/components/ui/link-rapido'

/** Setinha no fim da linha da tabela: mostra que a linha abre o detalhe. Com `scroll={false}`, a lista fica onde está (painel). */
export function AbrirLinha({ href, rotulo, scroll }: { href: string; rotulo: string; scroll?: boolean }) {
  return (
    <td className="w-8 pl-0 text-right">
      <LinkRapido href={href} scroll={scroll} aria-label={rotulo} title={rotulo} className="inline-flex rounded-md p-1 text-muted hover:bg-rail hover:text-brand-700">
        <ChevronRight className="size-4" />
      </LinkRapido>
    </td>
  )
}

import { ArrowLeft } from 'lucide-react'
import { LinkRapido } from '@/components/ui/link-rapido'

export function LinkVoltar({ href, children }: { href: string; children: string }) {
  return (
    <LinkRapido href={href} className="mb-3 inline-flex items-center gap-1 text-sm text-muted hover:text-ink">
      <ArrowLeft className="size-4" /> {children}
    </LinkRapido>
  )
}

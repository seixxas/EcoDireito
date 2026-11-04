'use client'

import { X } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useRef, type ReactNode } from 'react'
import { classeBotao } from '@/components/ui/form'

/** Painel à direita, por cima da lista; no celular, a tela toda. `fechar` é a URL da lista com os filtros de agora. */
export function PainelLateral({ titulo, subtitulo, fechar, children }: { titulo: string; subtitulo: ReactNode; fechar: string; children: ReactNode }) {
  const router = useRouter()
  const painel = useRef<HTMLElement>(null)

  useEffect(() => painel.current?.focus({ preventScroll: true }), [])

  useEffect(() => {
    const aoTeclar = (evento: KeyboardEvent) => {
      if (evento.key === 'Escape') router.push(fechar, { scroll: false })
    }
    document.addEventListener('keydown', aoTeclar)
    return () => document.removeEventListener('keydown', aoTeclar)
  }, [router, fechar])

  return (
    <aside
      ref={painel}
      role="dialog"
      aria-label={titulo}
      tabIndex={-1}
      className="fixed inset-0 z-20 overflow-y-auto overscroll-contain bg-canvas outline-none sm:left-auto sm:w-120 sm:border-l sm:border-line sm:shadow-lg"
    >
      <header className="sticky top-0 z-10 flex items-start justify-between gap-3 border-b border-line bg-canvas px-4 py-3">
        <div className="min-w-0">
          <h2 className="font-display text-xl font-semibold tracking-tight text-ink">{titulo}</h2>
          <div className="mt-0.5 text-sm text-muted">{subtitulo}</div>
        </div>
        <Link href={fechar} scroll={false} className={classeBotao('secundario')}>
          <X className="size-4" /> Fechar
        </Link>
      </header>
      <div className="p-4">{children}</div>
    </aside>
  )
}

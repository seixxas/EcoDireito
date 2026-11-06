'use client'

import { LinkRapido } from '@/components/ui/link-rapido'
import { useRouter } from 'next/navigation'
import { useEffect, useRef, type ReactNode } from 'react'
import { classeBotao } from '@/components/ui/form'

/** Painel à direita, por cima da lista; no celular e no tablet em pé, a tela toda. `fechar` é a URL da lista com os filtros de agora. */
export function PainelLateral({ titulo, subtitulo, fechar, children }: { titulo: string; subtitulo: ReactNode; fechar: string; children: ReactNode }) {
  const router = useRouter()
  const painel = useRef<HTMLElement>(null)

  useEffect(() => painel.current?.focus({ preventScroll: true }), [])

  useEffect(() => {
    const aoTeclar = (evento: KeyboardEvent) => {
      // Com a caixa de confirmação aberta, o Esc fecha só a caixa.
      if (evento.key === 'Escape' && !document.querySelector('dialog[open]')) router.push(fechar, { scroll: false })
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
      className="fixed inset-0 z-20 overflow-y-auto overscroll-contain bg-canvas outline-none md:left-auto md:w-[42rem] md:border-l-2 md:border-line md:shadow-lg"
    >
      <header className="sticky top-0 z-10 flex flex-wrap items-start justify-between gap-3 border-b-2 border-line bg-canvas px-4 py-4 sm:px-6">
        <div className="min-w-0 flex-1 basis-60">
          <h2 className="text-2xl font-semibold text-ink">{titulo}</h2>
          <div className="mt-1 text-base text-muted">{subtitulo}</div>
        </div>
        <LinkRapido href={fechar} scroll={false} className={classeBotao('secundario')}>
          Fechar
        </LinkRapido>
      </header>
      <div className="p-4 sm:p-6">{children}</div>
    </aside>
  )
}

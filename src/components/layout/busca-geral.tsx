'use client'

import { Search } from 'lucide-react'
import Form from 'next/form'
import { useEffect, useRef } from 'react'

/** Busca de toda a plataforma (cliente, processo, nota), sempre à vista. Ctrl+K leva o cursor para ela. */
export function BuscaGeral() {
  const campo = useRef<HTMLInputElement>(null)

  useEffect(() => {
    function atalho(evento: KeyboardEvent) {
      if ((evento.ctrlKey || evento.metaKey) && evento.key.toLowerCase() === 'k') {
        evento.preventDefault()
        campo.current?.select()
      }
    }
    window.addEventListener('keydown', atalho)
    return () => window.removeEventListener('keydown', atalho)
  }, [])

  return (
    <Form action="/busca" role="search" className="relative">
      <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-nav-muted" />
      <input
        ref={campo}
        type="search"
        name="q"
        placeholder="Buscar"
        aria-label="Buscar cliente, processo ou nota"
        title="Cliente, processo, nº SEI ou nº da NF (Ctrl+K)"
        className="h-9 w-full rounded-md border border-white/15 bg-white/8 pl-8 pr-2 text-sm text-white outline-none placeholder:text-nav-muted focus:border-white/40"
      />
    </Form>
  )
}

'use client'

import Form from 'next/form'
import { useEffect, useRef } from 'react'

/** Busca de toda a plataforma (cliente, projeto, nota), sempre à vista. Ctrl+K leva o cursor para ela. */
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
    <Form action="/busca" role="search">
      <input
        ref={campo}
        type="search"
        name="q"
        placeholder="Buscar (Ctrl+K)"
        aria-label="Buscar cliente, projeto ou nota"
        title="Cliente, projeto, nº SEI ou nº da NF (Ctrl+K)"
        className="min-h-9 w-full rounded-md border border-campo bg-surface px-3 text-sm text-ink outline-none placeholder:text-subtle focus:border-brand-700 focus:ring-2 focus:ring-brand-100 pointer-coarse:min-h-11"
      />
    </Form>
  )
}

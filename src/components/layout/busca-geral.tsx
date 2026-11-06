'use client'

import Form from 'next/form'
import { useEffect, useRef } from 'react'

/** Busca de toda a plataforma (cliente, projeto, nota), sempre à vista. Parada, tem cara de botão; ao clicar, vira campo. Ctrl+K leva o cursor para ela. */
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
        placeholder="Buscar"
        aria-label="Buscar cliente, projeto ou nota"
        title="Cliente, projeto, nº SEI ou nº da NF (Ctrl+K)"
        className="min-h-13 w-full cursor-pointer rounded-md border-2 border-brand-700 bg-surface px-4 text-center text-base font-medium text-ink outline-none transition-colors placeholder:text-brand-700 placeholder:opacity-100 hover:bg-brand-50 focus:cursor-text focus:bg-surface focus:text-left focus:ring-3 focus:ring-brand-300 focus:placeholder:text-subtle"
      />
    </Form>
  )
}

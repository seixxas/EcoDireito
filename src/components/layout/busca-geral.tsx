'use client'

import Form from 'next/form'
import { useEffect, useRef } from 'react'
import { Icone } from '@/components/ui/icone'

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
    <Form action="/busca" role="search" className="relative">
      <Icone nome="search" className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-subtle" />
      <input
        ref={campo}
        type="search"
        name="q"
        placeholder="Buscar projeto, cliente ou nº SEI"
        aria-label="Buscar cliente, projeto ou nota"
        title="Cliente, projeto, nº SEI ou nº da NF (Ctrl+K)"
        className="h-[38px] w-full rounded-lg border border-line bg-painel pl-10 pr-3 text-[0.90625rem] text-ink outline-none placeholder:text-subtle focus:border-brand-700 focus:bg-surface focus:ring-2 focus:ring-brand-100 pointer-coarse:h-11"
      />
    </Form>
  )
}

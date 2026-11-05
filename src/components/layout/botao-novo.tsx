'use client'

import { Plus } from 'lucide-react'
import { LinkRapido } from '@/components/ui/link-rapido'
import { useRef } from 'react'
import { pode, type Area, type Papel } from '@/lib/permissoes'

const OPCOES: { href: string; rotulo: string; area: Area }[] = [
  { href: '/comercial/nova', rotulo: 'Proposta', area: 'comercial' },
  { href: '/processos/novo', rotulo: 'Processo', area: 'prazos' },
  { href: '/processos/clientes/novo', rotulo: 'Cliente', area: 'prazos' },
  { href: '/financeiro/notas/nova', rotulo: 'Nota fiscal', area: 'financeiro' },
  { href: '/financeiro/lancamentos?novo=1', rotulo: 'Lançamento', area: 'financeiro' },
]

/** "Novo" de qualquer tela: só o que o perfil pode criar. Fecha ao escolher ou ao clicar fora. */
export function BotaoNovo({ papel }: { papel: Papel }) {
  const menu = useRef<HTMLDetailsElement>(null)
  const opcoes = OPCOES.filter((opcao) => pode(papel, opcao.area, 'editar'))
  if (opcoes.length === 0) return null

  return (
    <details
      ref={menu}
      className="group relative"
      onBlur={(evento) => {
        if (!evento.currentTarget.contains(evento.relatedTarget)) evento.currentTarget.open = false
      }}
    >
      <summary className="flex h-9 cursor-pointer list-none items-center justify-center gap-1.5 rounded-md bg-white/12 px-3 text-sm font-medium text-white transition-colors hover:bg-white/18 [&::-webkit-details-marker]:hidden">
        <Plus className="size-4" /> Novo
      </summary>
      <ul className="absolute left-0 z-20 mt-1 min-w-full rounded-lg border border-line bg-surface p-1 shadow-sm">
        {opcoes.map(({ href, rotulo }) => (
          <li key={href}>
            <LinkRapido
              href={href}
              onClick={() => {
                if (menu.current) menu.current.open = false
              }}
              className="block whitespace-nowrap rounded-md px-2.5 py-1.5 text-sm text-ink hover:bg-brand-50"
            >
              {rotulo}
            </LinkRapido>
          </li>
        ))}
      </ul>
    </details>
  )
}

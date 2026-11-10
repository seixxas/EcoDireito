'use client'

import { LinkRapido } from '@/components/ui/link-rapido'
import { useRef } from 'react'
import { classeBotao } from '@/components/ui/form'
import { Icone } from '@/components/ui/icone'
import { pode, type Area, type Papel } from '@/lib/permissoes'

const OPCOES: { href: string; rotulo: string; area: Area }[] = [
  { href: '/comercial/nova', rotulo: 'Proposta', area: 'comercial' },
  { href: '/projetos/novo', rotulo: 'Projeto', area: 'prazos' },
  { href: '/projetos/clientes/novo', rotulo: 'Cliente', area: 'prazos' },
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
      <summary className={classeBotao('primario', 'h-9 min-h-0 cursor-pointer list-none gap-1.5 pl-2.5 pr-3.5 [&::-webkit-details-marker]:hidden')}>
        <Icone nome="add" className="text-lg" />
        Novo
      </summary>
      <ul className="absolute right-0 z-40 mt-1.5 min-w-44 rounded-md border border-line bg-surface p-1 shadow-lg">
        {opcoes.map(({ href, rotulo }) => (
          <li key={href}>
            <LinkRapido
              href={href}
              onClick={() => {
                if (menu.current) menu.current.open = false
              }}
              className="flex min-h-8 items-center whitespace-nowrap rounded-md px-2 text-sm font-medium text-brand-700 hover:bg-brand-100 pointer-coarse:min-h-10"
            >
              {rotulo}
            </LinkRapido>
          </li>
        ))}
      </ul>
    </details>
  )
}

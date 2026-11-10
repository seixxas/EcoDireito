'use client'

import { useLayoutEffect } from 'react'
import { sair } from '@/app/(auth)/actions'
import { Icone } from '@/components/ui/icone'
import { PAPEIS } from '@/lib/permissoes'
import type { UsuarioDoMenu } from './menu-lateral'

function iniciais(nome: string) {
  const partes = nome.trim().split(/\s+/)
  return ((partes[0]?.[0] ?? '') + (partes.length > 1 ? partes[partes.length - 1][0] : '')).toUpperCase()
}

function trocarTema() {
  const tema = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark'
  document.documentElement.setAttribute('data-theme', tema)
  try {
    localStorage.setItem('tema', tema)
  } catch {
    // Sem armazenamento: vale só até recarregar.
  }
}

const classeDaOpcao = 'flex min-h-9 w-full items-center gap-2.5 rounded-md px-2.5 text-left text-sm font-medium text-ink hover:bg-painel pointer-coarse:min-h-11'

/** Avatar com as iniciais. Abre nome, perfil, tema e sair. Fecha ao clicar fora. */
export function MenuDaConta({ usuario }: { usuario: UsuarioDoMenu }) {
  // Em desenvolvimento o React remonta o <html> e apaga o atributo posto pelo script; aqui ele volta (o mesmo do BotaoTema).
  useLayoutEffect(() => {
    try {
      const tema = localStorage.getItem('tema')
      if (tema) document.documentElement.setAttribute('data-theme', tema)
    } catch {}
  }, [])

  return (
    <details
      className="relative"
      onBlur={(evento) => {
        if (!evento.currentTarget.contains(evento.relatedTarget)) evento.currentTarget.open = false
      }}
    >
      <summary
        title={usuario.nome}
        className="flex size-9 cursor-pointer list-none items-center justify-center rounded-full bg-brand-100 text-sm font-semibold text-brand-700 [&::-webkit-details-marker]:hidden"
      >
        {iniciais(usuario.nome)}
      </summary>
      <div className="absolute right-0 z-40 mt-2 w-60 rounded-xl border border-line bg-surface p-1.5 shadow-lg">
        <p className="px-2.5 pb-2 pt-1.5 text-xs leading-tight text-muted">
          <b className="block text-sm font-semibold text-ink">{usuario.nome}</b>
          {PAPEIS[usuario.papel].nome}
        </p>
        <button type="button" onClick={trocarTema} className={classeDaOpcao}>
          <Icone nome="dark_mode" className="text-muted dark:hidden" />
          <Icone nome="light_mode" className="hidden text-muted dark:inline-block" />
          <span className="dark:hidden">Tema escuro</span>
          <span className="hidden dark:inline">Tema claro</span>
        </button>
        <form action={sair}>
          <button className={classeDaOpcao}>
            <Icone nome="logout" className="text-muted" />
            Sair
          </button>
        </form>
      </div>
    </details>
  )
}

'use client'

import { Moon, Sun } from 'lucide-react'
import { useLayoutEffect } from 'react'
import { cn } from '@/lib/cn'

const CHAVE = 'tema'

function salvo() {
  try {
    return localStorage.getItem(CHAVE)
  } catch {
    return null
  }
}

/** Troca entre claro e escuro e guarda a escolha neste navegador. O ícone segue o `data-theme` por CSS, sem estado. */
export function BotaoTema({ comRotulo, className }: { comRotulo?: boolean; className?: string }) {
  // Em desenvolvimento o React remonta o <html> e apaga o atributo posto pelo script; aqui ele volta. Em produção não faz nada.
  useLayoutEffect(() => {
    const tema = salvo()
    if (tema) document.documentElement.setAttribute('data-theme', tema)
  }, [])

  function trocar() {
    const tema = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark'
    document.documentElement.setAttribute('data-theme', tema)
    try {
      localStorage.setItem(CHAVE, tema)
    } catch {
      // Sem armazenamento (aba anônima bloqueada): vale só até recarregar.
    }
  }

  return (
    <button type="button" onClick={trocar} title="Trocar entre modo claro e escuro" className={cn('flex items-center gap-2 rounded-md p-1.5', className)}>
      <Moon className="size-4 dark:hidden" />
      <Sun className="hidden size-4 dark:block" />
      {comRotulo && (
        <>
          <span className="dark:hidden">Modo escuro</span>
          <span className="hidden dark:inline">Modo claro</span>
        </>
      )}
    </button>
  )
}

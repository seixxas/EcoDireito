'use client'

import { useLayoutEffect } from 'react'
import { classeBotao } from '@/components/ui/form'

const CHAVE = 'tema'

function salvo() {
  try {
    return localStorage.getItem(CHAVE)
  } catch {
    return null
  }
}

/** Troca entre claro e escuro e guarda a escolha neste navegador. O texto segue o `data-theme` por CSS, sem estado. */
export function BotaoTema({ className }: { className?: string }) {
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
    <button type="button" onClick={trocar} className={classeBotao('secundario', className)}>
      <span className="dark:hidden">Tema escuro</span>
      <span className="hidden dark:inline">Tema claro</span>
    </button>
  )
}

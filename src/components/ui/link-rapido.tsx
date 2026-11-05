'use client'

import Link from 'next/link'
import { useRef, useState, type ComponentProps } from 'react'

/** Tempo com o mouse em cima para contar como intenção: só passar por cima de uma lista não busca nada. */
const MS_DE_INTENCAO = 60

/**
 * Link que prepara a tela quando a pessoa mostra que vai clicar: mouse em cima, foco ou toque.
 * O clique encontra a tela pronta, sem buscar no servidor todas as telas que aparecem na lista.
 */
export function LinkRapido(props: ComponentProps<typeof Link>) {
  const [intencao, setIntencao] = useState(false)
  const espera = useRef<ReturnType<typeof setTimeout>>(undefined)
  const preparar = () => setIntencao(true)
  return (
    <Link
      {...props}
      prefetch={intencao ? true : 'auto'}
      onMouseEnter={() => {
        espera.current = setTimeout(preparar, MS_DE_INTENCAO)
      }}
      onMouseLeave={() => clearTimeout(espera.current)}
      onFocus={preparar}
      onTouchStart={preparar}
    />
  )
}

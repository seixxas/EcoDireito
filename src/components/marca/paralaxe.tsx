'use client'

import { useEffect, useRef, type ReactNode } from 'react'

/**
 * Passa a posição do mouse (de −1 a 1) para as variáveis --px e --py. As camadas da cena do login usam isso para se mexer
 * em profundidades diferentes. Quem pediu menos movimento no sistema fica com a cena parada.
 */
export function Paralaxe({ children, className }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const caixa = ref.current
    if (!caixa || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    let quadro = 0
    function mover(evento: PointerEvent) {
      cancelAnimationFrame(quadro)
      quadro = requestAnimationFrame(() => {
        caixa!.style.setProperty('--px', ((evento.clientX / window.innerWidth) * 2 - 1).toFixed(3))
        caixa!.style.setProperty('--py', ((evento.clientY / window.innerHeight) * 2 - 1).toFixed(3))
      })
    }
    window.addEventListener('pointermove', mover)
    return () => {
      cancelAnimationFrame(quadro)
      window.removeEventListener('pointermove', mover)
    }
  }, [])

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  )
}

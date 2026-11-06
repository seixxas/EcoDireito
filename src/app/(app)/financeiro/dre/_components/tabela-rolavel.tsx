'use client'

import { useEffect, useRef, useState, type ReactNode } from 'react'
import { classeBotao } from '@/components/ui/form'

type Medida = {
  /** Coluna das contas. */
  inicio: number
  /** Bloco travado à direita, com o espaço antes dele (0 em tela estreita, onde ele não trava). */
  fim: number
  /** Há meses escondidos de cada lado. */
  antes: boolean
  depois: boolean
}

/** Lê o layout da página: só roda quando o tamanho muda, nunca a cada rolagem. */
function medirTravadas(area: HTMLElement): Pick<Medida, 'inicio' | 'fim'> | null {
  const rotulo = area.querySelector<HTMLElement>('thead th')
  if (!rotulo) return null
  const espaco = area.querySelector<HTMLElement>('[data-espaco-fixo]')
  return {
    inicio: rotulo.offsetWidth,
    fim: espaco && getComputedStyle(espaco).position === 'sticky' ? Math.round(area.getBoundingClientRect().right - espaco.getBoundingClientRect().left) : 0,
  }
}

const mesma = (a: Medida | null, b: Medida | null) => a === b || (!!a && !!b && a.inicio === b.inicio && a.fim === b.fim && a.antes === b.antes && a.depois === b.depois)

/**
 * Grade que rola para o lado: pelos botões, que andam de mês inteiro em mês inteiro, ou pela barra de cima, grossa para ser fácil de pegar e presa
 * no topo ao descer (troca de mês sem ir até o fim da tabela). Uma sombra fina marca a borda das colunas travadas enquanto houver meses por baixo.
 * A tabela marca com `data-mes` o título de cada mês e com `data-espaco-fixo` o espaço antes do bloco travado à direita.
 */
export function TabelaRolavel({ acoes, children }: { acoes?: ReactNode; children: ReactNode }) {
  const area = useRef<HTMLDivElement>(null)
  const topo = useRef<HTMLDivElement>(null)
  // Só quem a pessoa está rolando move o outro. Se os dois se copiassem, o eco puxaria a rolagem para trás.
  const lider = useRef<'area' | 'topo'>('area')
  const [medida, setMedida] = useState<Medida | null>(null)
  const [largura, setLargura] = useState(0)

  useEffect(() => {
    const el = area.current
    if (!el) return
    let travadas: Pick<Medida, 'inicio' | 'fim'> | null = null
    let maximo = 0
    let quadro = 0
    const sombras = () => {
      quadro = 0
      const nova = travadas && { ...travadas, antes: el.scrollLeft > 1, depois: el.scrollLeft < maximo - 1 }
      setMedida((atual) => (mesma(atual, nova) ? atual : nova))
    }
    const medirTudo = () => {
      travadas = medirTravadas(el)
      maximo = el.scrollWidth - el.clientWidth
      // A barra de cima não tem a borda da tabela: soma a borda para as duas rolarem a mesma distância.
      setLargura(maximo > 1 ? el.scrollWidth + el.offsetWidth - el.clientWidth : 0)
      if (topo.current) topo.current.scrollLeft = el.scrollLeft
      sombras()
    }
    const rolar = () => {
      if (lider.current === 'area' && topo.current) topo.current.scrollLeft = el.scrollLeft
      if (!quadro) quadro = requestAnimationFrame(sombras)
    }
    const assumir = () => {
      lider.current = 'area'
    }
    const gestos = ['wheel', 'pointerdown', 'touchstart', 'keydown', 'focusin'] as const
    const observador = new ResizeObserver(medirTudo)
    observador.observe(el)
    if (el.firstElementChild) observador.observe(el.firstElementChild)
    el.addEventListener('scroll', rolar, { passive: true })
    for (const gesto of gestos) el.addEventListener(gesto, assumir, { passive: true })
    return () => {
      observador.disconnect()
      cancelAnimationFrame(quadro)
      el.removeEventListener('scroll', rolar)
      for (const gesto of gestos) el.removeEventListener(gesto, assumir)
    }
  }, [])

  const assumirTopo = () => {
    lider.current = 'topo'
  }

  /** Para no mês seguinte ao último inteiro, encostado na coluna travada; sem mais meses, vai até a ponta da tabela. */
  const andar = (lado: 'antes' | 'depois') => {
    const el = area.current
    if (!el || !medida) return
    const janela = el.clientWidth - medida.inicio - medida.fim
    const meses = [...el.querySelectorAll<HTMLElement>('[data-mes]')]
    const esquerda = el.scrollLeft + medida.inicio
    const proximo = meses.find((mes) => mes.offsetLeft + mes.offsetWidth > esquerda + janela + 1)
    const anterior = meses.findLast((mes) => mes.offsetLeft < esquerda - 1)
    const posicao =
      lado === 'depois'
        ? proximo
          ? proximo.offsetLeft - medida.inicio
          : el.scrollWidth
        : anterior
          ? anterior.offsetLeft + anterior.offsetWidth - medida.inicio - janela
          : 0
    lider.current = 'area'
    el.scrollTo({ left: posicao, behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' })
  }

  return (
    <div className="min-w-0">
      <div className="mb-1.5 flex flex-wrap gap-1">
        {largura > 0 && (
          <>
            <button type="button" disabled={!medida?.antes} onClick={() => andar('antes')} className={classeBotao('secundario', undefined, 'pequeno')}>
              ← Meses anteriores
            </button>
            <button type="button" disabled={!medida?.depois} onClick={() => andar('depois')} className={classeBotao('secundario', undefined, 'pequeno')}>
              Próximos meses →
            </button>
          </>
        )}
        {acoes}
      </div>
      {largura > 0 && (
        <div
          ref={topo}
          aria-hidden="true"
          onPointerDown={assumirTopo}
          onTouchStart={assumirTopo}
          onWheel={assumirTopo}
          onScroll={(evento) => {
            if (lider.current === 'topo' && area.current) area.current.scrollLeft = evento.currentTarget.scrollLeft
          }}
          className="top-0 z-30 mb-1 hidden overflow-x-auto overscroll-x-contain bg-canvas lg:sticky lg:block [&::-webkit-scrollbar-thumb:hover]:bg-brand-700 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-campo [&::-webkit-scrollbar-track]:rounded-full [&::-webkit-scrollbar-track]:bg-rail [&::-webkit-scrollbar]:h-2"
        >
          <div style={{ width: largura, height: 1 }} />
        </div>
      )}
      <div className="relative min-w-0">
        <div
          ref={area}
          // Com o foco no teclado, o navegador traz o valor para a parte que não fica por baixo das colunas travadas.
          style={{ scrollPaddingLeft: medida?.inicio, scrollPaddingRight: medida?.fim }}
          className="min-w-0 overflow-x-auto overscroll-x-contain rounded-lg border border-line bg-surface [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {children}
        </div>
        {medida?.antes && <Sombra lado="esquerda" distancia={medida.inicio} />}
        {medida?.depois && <Sombra lado="direita" distancia={medida.fim} />}
      </div>
    </div>
  )
}

function Sombra({ lado, distancia }: { lado: 'esquerda' | 'direita'; distancia: number }) {
  const direita = lado === 'direita'
  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none absolute top-px bottom-px z-20 w-2.5 from-ink/15 to-transparent ${direita ? 'bg-linear-to-l' : 'bg-linear-to-r'}`}
      style={direita ? { right: Math.max(distancia, 1) } : { left: Math.max(distancia, 1) }}
    />
  )
}

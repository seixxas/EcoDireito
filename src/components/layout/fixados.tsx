'use client'

import { Star, X } from 'lucide-react'
import Link from 'next/link'
import { useSyncExternalStore } from 'react'
import { classeBotao } from '@/components/ui/form'
import { cn } from '@/lib/cn'

type Fixado = { href: string; rotulo: string }

const CHAVE = 'fixados'
const AVISO = 'fixados-mudou'
const NENHUM: Fixado[] = []

/** O `useSyncExternalStore` compara por referência: a mesma lista guardada devolve o mesmo array. */
let ultimo: { guardado: string | null; lista: Fixado[] } = { guardado: null, lista: NENHUM }

function ler() {
  try {
    const guardado = localStorage.getItem(CHAVE)
    if (guardado !== ultimo.guardado) ultimo = { guardado, lista: guardado ? JSON.parse(guardado) : NENHUM }
    return ultimo.lista
  } catch {
    return NENHUM
  }
}

function assinar(avisar: () => void) {
  window.addEventListener(AVISO, avisar)
  window.addEventListener('storage', avisar)
  return () => {
    window.removeEventListener(AVISO, avisar)
    window.removeEventListener('storage', avisar)
  }
}

function gravar(lista: Fixado[]) {
  try {
    localStorage.setItem(CHAVE, JSON.stringify(lista))
    window.dispatchEvent(new Event(AVISO))
  } catch {
    // Navegador sem armazenamento: o atalho só não fica guardado.
  }
}

const useFixados = () => useSyncExternalStore(assinar, ler, () => NENHUM)

/** Fixa o processo no menu. Fica neste navegador: é conveniência de cada pessoa, não dado do escritório. */
export function BotaoFixar({ href, rotulo }: Fixado) {
  const fixados = useFixados()
  const fixado = fixados.some((item) => item.href === href)
  return (
    <button
      type="button"
      aria-pressed={fixado}
      onClick={() => gravar(fixado ? fixados.filter((item) => item.href !== href) : [...fixados, { href, rotulo }])}
      className={classeBotao('secundario')}
    >
      <Star className={cn('size-4', fixado && 'fill-accent text-accent')} /> {fixado ? 'Fixado' : 'Fixar'}
    </button>
  )
}

export function ListaFixados() {
  const fixados = useFixados()
  if (fixados.length === 0) return null
  return (
    <div>
      <p className="mb-1 px-2 text-xs text-nav-muted">Fixados</p>
      <ul className="flex flex-col gap-px">
        {fixados.map(({ href, rotulo }) => (
          <li key={href} className="group/fixado flex items-center rounded-md hover:bg-white/6">
            <Link href={href} className="min-w-0 flex-1 truncate px-2 py-1 text-sm text-nav-ink/85 hover:text-white">
              {rotulo}
            </Link>
            <button
              type="button"
              title="Tirar dos fixados"
              onClick={() => gravar(fixados.filter((item) => item.href !== href))}
              className="mr-1 rounded p-0.5 text-nav-muted opacity-0 hover:text-white focus:opacity-100 group-hover/fixado:opacity-100"
            >
              <X className="size-3.5" />
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}

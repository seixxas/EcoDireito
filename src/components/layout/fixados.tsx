'use client'

import { LinkRapido } from '@/components/ui/link-rapido'
import { useSyncExternalStore } from 'react'
import { classeBotao } from '@/components/ui/form'

type Fixado = { href: string; rotulo: string }

const CHAVE = 'fixados'
const AVISO = 'fixados-mudou'
const NENHUM: Fixado[] = []

/** O `useSyncExternalStore` compara por referência: a mesma lista guardada devolve o mesmo array. */
let ultimo: { guardado: string | null; lista: Fixado[] } = { guardado: null, lista: NENHUM }

/** Atalho guardado quando a tela ainda se chamava Processos. Sem isto, ele ficaria repetido ao fixar de novo. */
const comEnderecoNovo = (item: Fixado) => ({ ...item, href: item.href.replace(/^\/processos/, '/projetos') })

function ler() {
  try {
    const guardado = localStorage.getItem(CHAVE)
    if (guardado !== ultimo.guardado) ultimo = { guardado, lista: guardado ? JSON.parse(guardado).map(comEnderecoNovo) : NENHUM }
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

/** Fixa o projeto no menu. Fica neste navegador: é conveniência de cada pessoa, não dado do escritório. */
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
      {fixado ? 'Fixado' : 'Fixar'}
    </button>
  )
}

export function ListaFixados() {
  const fixados = useFixados()
  if (fixados.length === 0) return null
  return (
    <div>
      <p className="mb-2 px-1.5 text-xs font-semibold text-subtle">Fixados</p>
      <ul className="flex flex-col gap-2">
        {fixados.map(({ href, rotulo }) => (
          <li key={href} className="flex items-stretch gap-1.5">
            <LinkRapido href={href} className="flex min-h-12 min-w-0 flex-1 items-center rounded-md bg-surface px-3 text-sm font-medium text-brand-700 hover:bg-brand-100">
              <span className="truncate">{rotulo}</span>
            </LinkRapido>
            <button type="button" title="Tirar dos fixados" onClick={() => gravar(fixados.filter((item) => item.href !== href))} className={classeBotao('secundario', 'min-h-12 px-2.5 text-sm')}>
              Tirar
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}

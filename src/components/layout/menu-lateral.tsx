'use client'

import {
  CalendarClock,
  ChartColumn,
  ChartLine,
  FolderKanban,
  HandCoins,
  LayoutDashboard,
  Leaf,
  Newspaper,
  Receipt,
  type LucideIcon,
} from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Suspense } from 'react'
import { cn } from '@/lib/cn'

type Item = { href: string; rotulo: string; icone: LucideIcon }

const GRUPOS: { titulo?: string; itens: Item[] }[] = [
  {
    itens: [
      { href: '/', rotulo: 'Painel', icone: LayoutDashboard },
      { href: '/prazos', rotulo: 'Prazos', icone: CalendarClock },
      { href: '/processos', rotulo: 'Processos', icone: FolderKanban },
      { href: '/publicacoes', rotulo: 'Diário Oficial', icone: Newspaper },
    ],
  },
  {
    titulo: 'Financeiro',
    itens: [
      { href: '/financeiro', rotulo: 'Faturamento', icone: Receipt },
      { href: '/financeiro/receber', rotulo: 'Contas a receber', icone: HandCoins },
      { href: '/financeiro/dre', rotulo: 'DRE', icone: ChartColumn },
      { href: '/financeiro/fluxo', rotulo: 'Fluxo de caixa', icone: ChartLine },
    ],
  },
]

const TODOS = GRUPOS.flatMap((g) => g.itens)

function ativo(pathname: string, href: string) {
  // O item mais específico que bate com a URL é o ativo (/financeiro não acende em /financeiro/dre).
  const candidatos = TODOS.filter((i) => pathname === i.href || (i.href !== '/' && pathname.startsWith(`${i.href}/`)))
  return candidatos.sort((a, b) => b.href.length - a.href.length)[0]?.href === href
}

function Marca() {
  return (
    <Link href="/" className="flex items-center gap-2.5">
      <span className="flex size-9 items-center justify-center rounded-xl bg-brand-500 text-white">
        <Leaf className="size-5" />
      </span>
      <span className="leading-none">
        <span className="block font-display text-lg font-semibold text-white">eco direito</span>
        <span className="block text-[10px] font-semibold uppercase tracking-[0.18em] text-brand-300">ambiental</span>
      </span>
    </Link>
  )
}

/** O menu lê a URL; no Next 16 isso precisa de Suspense. Enquanto isso, mostra o menu sem item ativo. */
export function MenuLateral() {
  return (
    <Suspense fallback={<Menu pathname="" />}>
      <MenuNaRota />
    </Suspense>
  )
}

function MenuNaRota() {
  return <Menu pathname={usePathname()} />
}

function Menu({ pathname }: { pathname: string }) {
  return (
    <>
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col bg-brand-900 px-4 py-6 lg:flex">
        <Marca />
        <nav className="mt-8 flex flex-1 flex-col gap-6">
          {GRUPOS.map((grupo, i) => (
            <div key={i}>
              {grupo.titulo && <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-brand-300">{grupo.titulo}</p>}
              <ul className="flex flex-col gap-0.5">
                {grupo.itens.map(({ href, rotulo, icone: Icone }) => (
                  <li key={href}>
                    <Link
                      href={href}
                      className={cn(
                        'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                        ativo(pathname, href) ? 'bg-white/12 text-white' : 'text-brand-100/80 hover:bg-white/6 hover:text-white',
                      )}
                    >
                      <Icone className="size-4.5" />
                      {rotulo}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>
        <div className="rounded-xl bg-white/6 p-3">
          <div className="flex items-center gap-3">
            <span className="flex size-9 items-center justify-center rounded-full bg-accent font-semibold text-brand-900">E</span>
            <span className="text-sm leading-tight">
              <span className="block font-semibold text-white">Elaine</span>
              <span className="block text-brand-300">Sócia</span>
            </span>
          </div>
          <p className="mt-3 rounded-md bg-accent/15 px-2 py-1 text-center text-[11px] font-semibold text-accent">Dados fictícios para demonstração</p>
        </div>
      </aside>

      <header className="sticky top-0 z-10 bg-brand-900 px-4 py-3 lg:hidden">
        <Marca />
        <nav className="-mx-4 mt-3 flex gap-1 overflow-x-auto px-4">
          {TODOS.map(({ href, rotulo }) => (
            <Link
              key={href}
              href={href}
              className={cn('whitespace-nowrap rounded-lg px-3 py-1.5 text-sm', ativo(pathname, href) ? 'bg-white/15 text-white' : 'text-brand-100/80')}
            >
              {rotulo}
            </Link>
          ))}
        </nav>
      </header>
    </>
  )
}

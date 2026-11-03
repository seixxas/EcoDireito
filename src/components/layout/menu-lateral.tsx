'use client'

import {
  ArrowLeftRight,
  CalendarClock,
  ChartColumn,
  ChartLine,
  FileSignature,
  FolderKanban,
  HandCoins,
  Landmark,
  LayoutDashboard,
  Leaf,
  LogOut,
  Newspaper,
  Receipt,
  Users,
  type LucideIcon,
} from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Suspense } from 'react'
import { sair } from '@/app/(auth)/actions'
import { cn } from '@/lib/cn'
import { PAPEIS, pode, type Area, type Papel } from '@/lib/permissoes'

type Item = { href: string; rotulo: string; icone: LucideIcon; area: Area }
export type UsuarioDoMenu = { nome: string; papel: Papel }

const GRUPOS: { titulo?: string; itens: Item[] }[] = [
  {
    itens: [
      { href: '/', rotulo: 'Painel', icone: LayoutDashboard, area: 'prazos' },
      { href: '/prazos', rotulo: 'Prazos', icone: CalendarClock, area: 'prazos' },
      { href: '/processos', rotulo: 'Processos', icone: FolderKanban, area: 'prazos' },
      { href: '/publicacoes', rotulo: 'Diário Oficial', icone: Newspaper, area: 'prazos' },
    ],
  },
  {
    titulo: 'Financeiro',
    itens: [
      { href: '/financeiro', rotulo: 'Faturamento', icone: Receipt, area: 'financeiro' },
      { href: '/financeiro/receber', rotulo: 'Contas a receber', icone: HandCoins, area: 'financeiro' },
      { href: '/financeiro/dre', rotulo: 'DRE', icone: ChartColumn, area: 'financeiro' },
      { href: '/financeiro/fluxo', rotulo: 'Fluxo de caixa', icone: ChartLine, area: 'financeiro' },
      { href: '/financeiro/lancamentos', rotulo: 'Lançamentos', icone: ArrowLeftRight, area: 'financeiro' },
      { href: '/financeiro/extrato', rotulo: 'Extrato', icone: Landmark, area: 'financeiro' },
      { href: '/financeiro/contratos', rotulo: 'Contratos', icone: FileSignature, area: 'financeiro' },
    ],
  },
  {
    titulo: 'Administração',
    itens: [{ href: '/usuarios', rotulo: 'Usuários', icone: Users, area: 'usuarios' }],
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
export function MenuLateral({ usuario }: { usuario?: UsuarioDoMenu }) {
  return (
    <Suspense fallback={<Menu pathname="" usuario={usuario} />}>
      <MenuNaRota usuario={usuario} />
    </Suspense>
  )
}

function MenuNaRota({ usuario }: { usuario?: UsuarioDoMenu }) {
  return <Menu pathname={usePathname()} usuario={usuario} />
}

function Menu({ pathname, usuario }: { pathname: string; usuario?: UsuarioDoMenu }) {
  // Enquanto o usuário carrega, nenhum link: ninguém vê, nem por um instante, o que o perfil não pode abrir.
  const visivel = (item: Item) => Boolean(usuario && pode(usuario.papel, item.area))
  const grupos = GRUPOS.map((g) => ({ ...g, itens: g.itens.filter(visivel) })).filter((g) => g.itens.length)

  return (
    <>
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col bg-brand-900 px-4 py-6 lg:flex">
        <Marca />
        <nav className="mt-8 flex flex-1 flex-col gap-6">
          {grupos.map((grupo, i) => (
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
        {usuario && (
          <div className="rounded-xl bg-white/6 p-3">
            <div className="flex items-center gap-3">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-accent font-semibold text-brand-900">{usuario.nome.at(0)}</span>
              <span className="min-w-0 flex-1 text-sm leading-tight">
                <span className="block truncate font-semibold text-white">{usuario.nome}</span>
                <span className="block text-brand-300">{PAPEIS[usuario.papel].nome}</span>
              </span>
              <form action={sair}>
                <button title="Sair" className="rounded-lg p-2 text-brand-300 hover:bg-white/10 hover:text-white">
                  <LogOut className="size-4" />
                </button>
              </form>
            </div>
            <p className="mt-3 rounded-md bg-accent/15 px-2 py-1 text-center text-[11px] font-semibold text-accent">Dados fictícios para demonstração</p>
          </div>
        )}
      </aside>

      <header className="sticky top-0 z-10 bg-brand-900 px-4 py-3 lg:hidden">
        <div className="flex items-center justify-between">
          <Marca />
          {usuario && (
            <form action={sair}>
              <button className="flex items-center gap-1.5 text-sm text-brand-100">
                <LogOut className="size-4" /> Sair
              </button>
            </form>
          )}
        </div>
        <nav className="-mx-4 mt-3 flex gap-1 overflow-x-auto px-4">
          {grupos
            .flatMap((g) => g.itens)
            .map(({ href, rotulo }) => (
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

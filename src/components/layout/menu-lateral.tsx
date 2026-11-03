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
  Leaf,
  ListTodo,
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
  { itens: [{ href: '/', rotulo: 'Hoje', icone: ListTodo, area: 'prazos' }] },
  {
    titulo: 'Processos',
    itens: [
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
      { href: '/financeiro/lancamentos', rotulo: 'Lançamentos', icone: ArrowLeftRight, area: 'financeiro' },
      { href: '/financeiro/extrato', rotulo: 'Extrato', icone: Landmark, area: 'financeiro' },
      { href: '/financeiro/contratos', rotulo: 'Contratos', icone: FileSignature, area: 'financeiro' },
      { href: '/financeiro/fluxo', rotulo: 'Fluxo de caixa', icone: ChartLine, area: 'financeiro' },
      { href: '/financeiro/dre', rotulo: 'DRE', icone: ChartColumn, area: 'financeiro' },
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
    <Link href="/" className="flex items-center gap-2">
      <span className="flex size-7 items-center justify-center rounded-md bg-brand-700 text-white">
        <Leaf className="size-4" />
      </span>
      <span className="font-display text-lg font-semibold leading-none text-ink">Eco Direito</span>
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
      <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r border-line bg-rail px-3 py-5 lg:flex">
        <div className="px-2">
          <Marca />
        </div>
        <nav className="mt-6 flex flex-1 flex-col gap-5 overflow-y-auto">
          {grupos.map((grupo, i) => (
            <div key={i}>
              {grupo.titulo && <p className="mb-1 px-2 text-xs text-subtle">{grupo.titulo}</p>}
              <ul className="flex flex-col gap-px">
                {grupo.itens.map(({ href, rotulo, icone: Icone }) => (
                  <li key={href}>
                    <Link
                      href={href}
                      className={cn(
                        'flex items-center gap-2.5 rounded-md px-2 py-1.5 text-sm transition-colors',
                        ativo(pathname, href) ? 'bg-surface font-medium text-ink ring-1 ring-line' : 'text-muted hover:bg-surface/60 hover:text-ink',
                      )}
                    >
                      <Icone className={cn('size-4', ativo(pathname, href) ? 'text-brand-700' : 'text-subtle')} />
                      {rotulo}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>
        {usuario && (
          <div className="border-t border-line px-2 pt-3">
            <div className="flex items-center gap-2.5">
              <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-brand-100 text-sm font-semibold text-brand-900">
                {usuario.nome.at(0)}
              </span>
              <span className="min-w-0 flex-1 text-sm leading-tight">
                <span className="block truncate font-medium text-ink">{usuario.nome}</span>
                <span className="block text-xs text-muted">{PAPEIS[usuario.papel].nome}</span>
              </span>
              <form action={sair}>
                <button title="Sair" className="rounded-md p-1.5 text-subtle hover:bg-surface hover:text-ink">
                  <LogOut className="size-4" />
                </button>
              </form>
            </div>
            <p className="mt-2 text-xs text-warn">Dados fictícios para demonstração</p>
          </div>
        )}
      </aside>

      <header className="sticky top-0 z-10 border-b border-line bg-rail px-4 py-3 lg:hidden">
        <div className="flex items-center justify-between">
          <Marca />
          {usuario && (
            <form action={sair}>
              <button className="flex items-center gap-1.5 text-sm text-muted">
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
                className={cn(
                  'whitespace-nowrap rounded-md px-2.5 py-1 text-sm',
                  ativo(pathname, href) ? 'bg-surface font-medium text-ink ring-1 ring-line' : 'text-muted',
                )}
              >
                {rotulo}
              </Link>
            ))}
        </nav>
      </header>
    </>
  )
}

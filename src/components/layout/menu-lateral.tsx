'use client'

import {
  ArrowLeftRight,
  CalendarClock,
  ChartColumn,
  ChartLine,
  FileSignature,
  FolderKanban,
  HandCoins,
  Handshake,
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
import { BotaoTema } from './botao-tema'
import { PAPEIS, pode, type Area, type Papel } from '@/lib/permissoes'

type Item = { href: string; rotulo: string; icone: LucideIcon; area: Area; emBreve?: true }
export type UsuarioDoMenu = { nome: string; papel: Papel }

const GRUPOS: { titulo?: string; itens: Item[] }[] = [
  { itens: [{ href: '/', rotulo: 'Hoje', icone: ListTodo, area: 'prazos' }] },
  { titulo: 'Comercial', itens: [{ href: '/comercial', rotulo: 'Propostas', icone: Handshake, area: 'comercial', emBreve: true }] },
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
      <span className="flex size-7 items-center justify-center rounded-md bg-brand-500 text-white">
        <Leaf className="size-4" />
      </span>
      <span className="font-display text-lg font-semibold leading-none text-white">Eco Direito</span>
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
      <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col bg-nav px-3 py-5 lg:flex">
        <div className="px-2">
          <Marca />
        </div>
        <nav className="mt-6 flex flex-1 flex-col gap-5 overflow-y-auto">
          {grupos.map((grupo, i) => (
            <div key={i}>
              {grupo.titulo && <p className="mb-1 px-2 text-xs text-nav-muted">{grupo.titulo}</p>}
              <ul className="flex flex-col gap-px">
                {grupo.itens.map(({ href, rotulo, icone: Icone, emBreve }) => (
                  <li key={href}>
                    <Link
                      href={href}
                      className={cn(
                        'flex items-center gap-2.5 rounded-md px-2 py-1.5 text-sm transition-colors',
                        ativo(pathname, href) ? 'bg-white/12 font-medium text-white' : 'text-nav-ink/85 hover:bg-white/6 hover:text-white',
                      )}
                    >
                      <Icone className={cn('size-4', ativo(pathname, href) ? 'text-white' : 'text-nav-muted')} />
                      {rotulo}
                      {emBreve && <span className="ml-auto rounded bg-accent/20 px-1.5 py-px text-[0.6875rem] font-medium text-accent">em breve</span>}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>
        {usuario && (
          <div className="border-t border-white/10 px-2 pt-3">
            <div className="flex items-center gap-2.5">
              <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-accent text-sm font-semibold text-nav">
                {usuario.nome.at(0)}
              </span>
              <span className="min-w-0 flex-1 text-sm leading-tight">
                <span className="block truncate font-medium text-white">{usuario.nome}</span>
                <span className="block text-xs text-nav-muted">{PAPEIS[usuario.papel].nome}</span>
              </span>
              <BotaoTema className="text-nav-muted hover:bg-white/10 hover:text-white" />
              <form action={sair}>
                <button title="Sair" className="rounded-md p-1.5 text-nav-muted hover:bg-white/10 hover:text-white">
                  <LogOut className="size-4" />
                </button>
              </form>
            </div>
            <p className="mt-2 text-xs text-accent">Dados fictícios para demonstração</p>
          </div>
        )}
      </aside>

      <header className="sticky top-0 z-10 bg-nav px-4 py-3 lg:hidden">
        <div className="flex items-center justify-between">
          <Marca />
          <div className="flex items-center gap-3">
            <BotaoTema className="text-nav-ink" />
            {usuario && (
              <form action={sair}>
                <button className="flex items-center gap-1.5 text-sm text-nav-ink">
                  <LogOut className="size-4" /> Sair
                </button>
              </form>
            )}
          </div>
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
                  ativo(pathname, href) ? 'bg-white/15 font-medium text-white' : 'text-nav-ink/85',
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

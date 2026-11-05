'use client'

import { FolderKanban, Handshake, Landmark, Leaf, ListTodo, LogOut, Users, type LucideIcon } from 'lucide-react'
import { usePathname } from 'next/navigation'
import { Suspense } from 'react'
import { sair } from '@/app/(auth)/actions'
import { LinkRapido } from '@/components/ui/link-rapido'
import { cn } from '@/lib/cn'
import { PAPEIS, pode, type Area, type Papel } from '@/lib/permissoes'
import { BotaoNovo } from './botao-novo'
import { BotaoTema } from './botao-tema'
import { BuscaGeral } from './busca-geral'
import { ListaFixados } from './fixados'

type Item = { href: string; rotulo: string; icone: LucideIcon; area: Area; tambem?: string[] }
export type UsuarioDoMenu = { nome: string; papel: Papel }

/** Quatro itens, na ordem do negócio. As telas de cada um ficam em abas lá dentro. */
const ITENS: Item[] = [
  { href: '/', rotulo: 'Hoje', icone: ListTodo, area: 'prazos', tambem: ['/publicacoes', '/prazos'] },
  { href: '/comercial', rotulo: 'Propostas', icone: Handshake, area: 'comercial' },
  { href: '/projetos', rotulo: 'Projetos', icone: FolderKanban, area: 'prazos' },
  { href: '/financeiro', rotulo: 'Financeiro', icone: Landmark, area: 'financeiro' },
]

function ativo(pathname: string, { href, tambem = [] }: Item) {
  return [href, ...tambem].some((caminho) => pathname === caminho || (caminho !== '/' && pathname.startsWith(`${caminho}/`)))
}

function Marca() {
  return (
    <LinkRapido href="/" className="flex items-center gap-2">
      <span className="flex size-7 items-center justify-center rounded-md bg-brand-500 text-white">
        <Leaf className="size-4" />
      </span>
      <span className="font-display text-lg font-semibold leading-none text-white">Eco Direito</span>
    </LinkRapido>
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
  const itens = ITENS.filter((item) => usuario && pode(usuario.papel, item.area))

  return (
    <>
      <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col bg-nav px-3 py-5 lg:flex print:hidden">
        <div className="px-2">
          <Marca />
        </div>
        {usuario && (
          <div className="mt-5 space-y-2">
            <BuscaGeral />
            <BotaoNovo papel={usuario.papel} />
          </div>
        )}
        <nav className="mt-5 flex flex-1 flex-col gap-5 overflow-y-auto">
          <ul className="flex flex-col gap-px">
            {itens.map((item) => {
              const { href, rotulo, icone: Icone } = item
              return (
                <li key={href}>
                  <LinkRapido
                    href={href}
                    className={cn(
                      'flex items-center gap-2.5 rounded-md px-2 py-2 text-sm transition-colors',
                      ativo(pathname, item) ? 'bg-white/12 font-medium text-white' : 'text-nav-ink/85 hover:bg-white/6 hover:text-white',
                    )}
                  >
                    <Icone className={cn('size-4', ativo(pathname, item) ? 'text-white' : 'text-nav-muted')} />
                    {rotulo}
                  </LinkRapido>
                </li>
              )
            })}
          </ul>
          {usuario && <ListaFixados />}
        </nav>
        {usuario && (
          <div className="border-t border-white/10 px-2 pt-3">
            {pode(usuario.papel, 'usuarios') && (
              <LinkRapido href="/usuarios" className="mb-2 flex items-center gap-2 text-sm text-nav-ink/85 hover:text-white">
                <Users className="size-4 text-nav-muted" /> Usuários
              </LinkRapido>
            )}
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

      <header className="sticky top-0 z-10 bg-nav px-4 py-3 lg:hidden print:hidden">
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
        {usuario && (
          <div className="mt-3 grid grid-cols-[minmax(0,1fr)_auto] gap-2">
            <BuscaGeral />
            <BotaoNovo papel={usuario.papel} />
          </div>
        )}
        <nav className="-mx-4 mt-3 flex gap-1 overflow-x-auto px-4">
          {[...itens, ...(usuario && pode(usuario.papel, 'usuarios') ? [{ href: '/usuarios', rotulo: 'Usuários', icone: Users, area: 'usuarios' as const }] : [])].map((item) => (
            <LinkRapido
              key={item.href}
              href={item.href}
              className={cn('whitespace-nowrap rounded-md px-2.5 py-1 text-sm', ativo(pathname, item) ? 'bg-white/15 font-medium text-white' : 'text-nav-ink/85')}
            >
              {item.rotulo}
            </LinkRapido>
          ))}
        </nav>
      </header>
    </>
  )
}

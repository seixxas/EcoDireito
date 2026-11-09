'use client'

import { usePathname } from 'next/navigation'
import { Suspense } from 'react'
import { sair } from '@/app/(auth)/actions'
import { classeBotao } from '@/components/ui/form'
import { LinkRapido } from '@/components/ui/link-rapido'
import { cn } from '@/lib/cn'
import { PAPEIS, pode, type Area, type Papel } from '@/lib/permissoes'
import { Logo } from '@/components/marca/logo'
import { BotaoNovo } from './botao-novo'
import { BotaoTema } from './botao-tema'
import { BuscaGeral } from './busca-geral'
import { ListaFixados } from './fixados'

type Item = { href: string; rotulo: string; area: Area; tambem?: string[] }
export type UsuarioDoMenu = { nome: string; papel: Papel }

/** Itens escritos por extenso, na ordem do negócio. As telas de cada um ficam em abas lá dentro. */
const ITENS: Item[] = [
  { href: '/', rotulo: 'Hoje', area: 'prazos', tambem: ['/publicacoes', '/prazos'] },
  { href: '/comercial', rotulo: 'Propostas', area: 'comercial' },
  { href: '/projetos', rotulo: 'Projetos', area: 'prazos' },
  { href: '/financeiro', rotulo: 'Financeiro', area: 'financeiro' },
  { href: '/usuarios', rotulo: 'Usuários', area: 'usuarios' },
]

function ativo(pathname: string, { href, tambem = [] }: Item) {
  return [href, ...tambem].some((caminho) => pathname === caminho || (caminho !== '/' && pathname.startsWith(`${caminho}/`)))
}

function Marca() {
  return (
    <LinkRapido href="/" className="block px-1">
      <Logo />
    </LinkRapido>
  )
}

function ItemDoMenu({ item, pathname, className }: { item: Item; pathname: string; className?: string }) {
  const ligado = ativo(pathname, item)
  return (
    <LinkRapido
      href={item.href}
      aria-current={ligado ? 'page' : undefined}
      className={cn(
        'flex min-h-9 items-center rounded-md px-3 text-sm font-medium transition-all duration-200 pointer-coarse:min-h-10',
        ligado ? 'copa brilho text-white shadow-[0_6px_16px_-8px_rgb(18_61_23_/_0.7)]' : 'text-brand-700 hover:translate-x-0.5 hover:bg-brand-100/80',
        className,
      )}
    >
      {item.rotulo}
    </LinkRapido>
  )
}

function BotaoSair({ className }: { className?: string }) {
  return (
    <form action={sair} className={className}>
      <button className={classeBotao('secundario', 'w-full', 'pequeno')}>Sair</button>
    </form>
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
      <aside className="vidro sticky top-0 hidden h-screen w-56 shrink-0 flex-col gap-2 overflow-y-auto rounded-none! border-y-0! border-l-0! px-3 py-4 lg:flex print:hidden">
        <div className="mb-1">
          <Marca />
        </div>
        {usuario && (
          <>
            <BuscaGeral />
            <BotaoNovo papel={usuario.papel} />
          </>
        )}
        <nav className="my-1 flex flex-col gap-0.5">
          {itens.map((item) => (
            <ItemDoMenu key={item.href} item={item} pathname={pathname} />
          ))}
        </nav>
        {usuario && <ListaFixados />}
        {usuario && (
          <div className="mt-auto flex flex-col gap-2 border-t border-line pt-3">
            <p className="px-2 text-xs leading-tight text-muted">
              <b className="block text-sm font-medium text-ink">{usuario.nome}</b>
              {PAPEIS[usuario.papel].nome}
            </p>
            <div className="grid grid-cols-2 gap-1.5">
              <BotaoTema />
              <BotaoSair />
            </div>
            <p className="px-2 text-2xs text-warn">Dados fictícios para demonstração</p>
          </div>
        )}
      </aside>

      <header className="vidro rounded-none! border-x-0! border-t-0! px-4 py-2.5 lg:hidden print:hidden">
        <div className="flex items-center justify-between gap-2">
          <Marca />
          <div className="flex items-center gap-1.5">
            {usuario && <BotaoTema />}
            {usuario && <BotaoSair />}
          </div>
        </div>
        {usuario && (
          <div className="mt-2 grid grid-cols-2 gap-1.5">
            <BuscaGeral />
            <BotaoNovo papel={usuario.papel} />
          </div>
        )}
        <nav className="mt-2 flex flex-wrap gap-1">
          {itens.map((item) => (
            <ItemDoMenu key={item.href} item={item} pathname={pathname} />
          ))}
        </nav>
        {usuario && (
          <div className="mt-2">
            <ListaFixados />
          </div>
        )}
      </header>
    </>
  )
}

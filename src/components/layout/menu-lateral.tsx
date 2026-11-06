'use client'

import { usePathname } from 'next/navigation'
import { Suspense } from 'react'
import { sair } from '@/app/(auth)/actions'
import { classeBotao } from '@/components/ui/form'
import { LinkRapido } from '@/components/ui/link-rapido'
import { cn } from '@/lib/cn'
import { PAPEIS, pode, type Area, type Papel } from '@/lib/permissoes'
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
    <LinkRapido href="/" className="block px-1.5 leading-tight">
      <span className="block text-[1.625rem] font-semibold text-brand-700">Eco Direito</span>
      <span className="mt-1 block text-2xs font-medium text-subtle">Consultoria ambiental</span>
    </LinkRapido>
  )
}

function ItemDoMenu({ item, pathname, className }: { item: Item; pathname: string; className?: string }) {
  const ligado = ativo(pathname, item)
  return (
    <LinkRapido
      href={item.href}
      aria-current={ligado ? 'page' : undefined}
      className={cn('flex items-center rounded-lg font-medium transition-colors', ligado ? 'bg-brand-700 text-on-brand' : 'bg-surface text-brand-700 hover:bg-brand-100', className)}
    >
      {item.rotulo}
    </LinkRapido>
  )
}

function BotaoSair({ className }: { className?: string }) {
  return (
    <form action={sair} className={className}>
      <button className={classeBotao('secundario', 'w-full')}>Sair</button>
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
      <aside className="sticky top-0 hidden h-screen w-68 shrink-0 flex-col gap-3 overflow-y-auto border-r border-line bg-rail px-5 py-7 lg:flex print:hidden">
        <div className="mb-3">
          <Marca />
        </div>
        {usuario && (
          <>
            <BuscaGeral />
            <BotaoNovo papel={usuario.papel} />
          </>
        )}
        <nav className="my-3 flex flex-col gap-3">
          {itens.map((item) => (
            <ItemDoMenu key={item.href} item={item} pathname={pathname} className="min-h-14 px-4.5 text-[1.25rem]" />
          ))}
        </nav>
        {usuario && <ListaFixados />}
        {usuario && (
          <div className="mt-auto flex flex-col gap-3 border-t border-line pt-5">
            <p className="px-1.5 text-sm">
              <b className="block text-base">{usuario.nome}</b>
              {PAPEIS[usuario.papel].nome}
            </p>
            <BotaoTema />
            <BotaoSair />
            <p className="px-1.5 text-2xs font-medium text-warn">Dados fictícios para demonstração</p>
          </div>
        )}
      </aside>

      <header className="border-b border-line bg-rail px-4 py-4 lg:hidden print:hidden">
        <div className="flex items-center justify-between gap-3">
          <Marca />
          {usuario && <BotaoSair />}
        </div>
        {usuario && (
          <div className="mt-3 grid grid-cols-2 gap-2">
            <BuscaGeral />
            <BotaoNovo papel={usuario.papel} />
          </div>
        )}
        <nav className="mt-3 flex flex-wrap gap-2">
          {itens.map((item) => (
            <ItemDoMenu key={item.href} item={item} pathname={pathname} className="min-h-13 px-3.5 text-base" />
          ))}
        </nav>
        {usuario && (
          <div className="mt-3">
            <ListaFixados />
          </div>
        )}
        {usuario && (
          <div className="mt-3 flex items-center justify-between gap-3">
            <p className="min-w-0 text-sm">
              <b>{usuario.nome}</b> · {PAPEIS[usuario.papel].nome}
            </p>
            <BotaoTema />
          </div>
        )}
      </header>
    </>
  )
}

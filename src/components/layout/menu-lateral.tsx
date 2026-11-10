'use client'

import { usePathname } from 'next/navigation'
import { Suspense } from 'react'
import { Logo } from '@/components/marca/logo'
import { Icone, type NomeIcone } from '@/components/ui/icone'
import { LinkRapido } from '@/components/ui/link-rapido'
import { cn } from '@/lib/cn'
import { sair } from '@/app/(auth)/actions'
import { PAPEIS, pode, type Area, type Papel } from '@/lib/permissoes'
import { ListaFixados } from './fixados'
import { iniciais, trocarTema } from './menu-da-conta'

type Item = { href: string; rotulo: string; icone: NomeIcone; area: Area; tambem?: string[]; grupo?: string }
/** Números vermelhos do menu: prazos vencidos (em Projetos) e publicações do Diário Oficial ainda sem revisão. */
export type Contadores = { vencidos?: number; publicacoes?: number }
export type UsuarioDoMenu = { nome: string; papel: Papel }

/** Ordem do desenho 3a (10/11), com Prazos e Diário Oficial à vista (pedido de 10/11: o Diário não era achado dentro do Resumo). */
const ITENS: Item[] = [
  { href: '/', rotulo: 'Resumo', icone: 'home', area: 'prazos' },
  { href: '/projetos', rotulo: 'Projetos', icone: 'folder', area: 'prazos', grupo: 'Processos' },
  { href: '/prazos', rotulo: 'Prazos', icone: 'alarm', area: 'prazos' },
  { href: '/publicacoes', rotulo: 'Diário Oficial', icone: 'newspaper', area: 'prazos' },
  { href: '/comercial', rotulo: 'Propostas', icone: 'description', area: 'comercial', grupo: 'Gestão' },
  { href: '/financeiro', rotulo: 'Financeiro', icone: 'payments', area: 'financeiro' },
  { href: '/usuarios', rotulo: 'Usuários', icone: 'group', area: 'usuarios' },
]

function contadorDo(href: string, { vencidos, publicacoes }: Contadores) {
  return href === '/projetos' ? vencidos : href === '/publicacoes' ? publicacoes : undefined
}

function ativo(pathname: string, { href, tambem = [] }: Item) {
  return [href, ...tambem].some((caminho) => pathname === caminho || (caminho !== '/' && pathname.startsWith(`${caminho}/`)))
}

/** Número vermelho ao lado do item. */
function Contador({ valor }: { valor: number }) {
  return <span className="ml-auto inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-danger px-1.5 text-xs font-semibold text-white">{valor}</span>
}

function ItemDoMenu({ item, pathname, contadores, compacto }: { item: Item; pathname: string; contadores: Contadores; compacto?: boolean }) {
  const ligado = ativo(pathname, item)
  const contador = contadorDo(item.href, contadores)
  return (
    <LinkRapido
      href={item.href}
      aria-current={ligado ? 'page' : undefined}
      className={cn(
        'flex min-h-[38px] items-center gap-3 rounded-lg px-3 text-[0.90625rem] font-medium transition-colors pointer-coarse:min-h-11',
        ligado ? 'bg-white/13 text-white' : 'text-white/82 hover:bg-white/7 hover:text-white',
        compacto && 'shrink-0 gap-2 px-2.5',
      )}
    >
      <Icone nome={item.icone} cheio={ligado} className={ligado ? 'text-brand-claro' : 'text-white/60'} />
      {item.rotulo}
      {!!contador && <Contador valor={contador} />}
    </LinkRapido>
  )
}

const classeDoBotao = 'flex min-h-9 flex-1 items-center justify-center gap-1.5 rounded-lg text-[0.8125rem] font-medium text-white/82 ring-1 ring-white/12 hover:bg-white/7 hover:text-white pointer-coarse:min-h-11'

/** Pé do menu: quem está logado, trocar o tema e sair. */
function Conta({ usuario }: { usuario: UsuarioDoMenu }) {
  return (
    <div className="mt-auto flex flex-col gap-3 border-t border-white/10 pt-4">
      <div className="flex items-center gap-2.5 px-1">
        <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-full bg-brand-claro text-sm font-semibold text-menu">{iniciais(usuario.nome)}</span>
        <span className="flex min-w-0 flex-col leading-tight">
          <b className="truncate text-sm font-semibold text-white">{usuario.nome}</b>
          <span className="truncate text-xs text-white/60">{PAPEIS[usuario.papel].nome}</span>
        </span>
      </div>
      <div className="flex gap-2">
        <button type="button" onClick={trocarTema} className={classeDoBotao}>
          <Icone nome="dark_mode" className="text-base dark:hidden" />
          <Icone nome="light_mode" className="hidden text-base dark:inline-block" />
          <span className="dark:hidden">Tema escuro</span>
          <span className="hidden dark:inline">Tema claro</span>
        </button>
        <form action={sair} className="flex flex-1">
          <button className={classeDoBotao}>
            <Icone nome="logout" className="text-base" />
            Sair
          </button>
        </form>
      </div>
      <p className="px-1 text-[0.6875rem] text-white/45">Dados fictícios para demonstração</p>
    </div>
  )
}

/** O menu lê a URL; no Next 16 isso precisa de Suspense. Enquanto isso, mostra o menu sem item ativo. */
export function MenuLateral({ usuario, contadores = {} }: { usuario?: UsuarioDoMenu; contadores?: Contadores }) {
  return (
    <Suspense fallback={<Menu pathname="" usuario={usuario} contadores={contadores} />}>
      <MenuNaRota usuario={usuario} contadores={contadores} />
    </Suspense>
  )
}

function MenuNaRota({ usuario, contadores = {} }: { usuario?: UsuarioDoMenu; contadores?: Contadores }) {
  return <Menu pathname={usePathname()} usuario={usuario} contadores={contadores} />
}

function Menu({ pathname, usuario, contadores }: { pathname: string; usuario?: UsuarioDoMenu; contadores: Contadores }) {
  // Enquanto o usuário carrega, nenhum link: ninguém vê, nem por um instante, o que o perfil não pode abrir.
  const itens = ITENS.filter((item) => usuario && pode(usuario.papel, item.area))

  return (
    <>
      <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col gap-6 overflow-y-auto bg-menu px-4 py-5 lg:flex print:hidden">
        <LinkRapido href="/" className="block px-1">
          <Logo claro legenda={false} />
        </LinkRapido>
        <nav className="flex flex-col gap-1">
          {itens.map((item) => (
            <div key={item.href} className="contents">
              {item.grupo && <p className="px-3 pb-1 pt-4 text-[0.6875rem] font-semibold uppercase tracking-[0.08em] text-white/45">{item.grupo}</p>}
              <ItemDoMenu item={item} pathname={pathname} contadores={contadores} />
            </div>
          ))}
        </nav>
        {usuario && <ListaFixados />}
        {usuario && <Conta usuario={usuario} />}
      </aside>

      <header className="bg-menu px-3 pb-2 pt-3 lg:hidden print:hidden">
        <LinkRapido href="/" className="mb-2 inline-block px-1">
          <Logo claro legenda={false} />
        </LinkRapido>
        <nav className="-mx-3 flex gap-1 overflow-x-auto px-3 pb-1">
          {itens.map((item) => (
            <ItemDoMenu key={item.href} item={item} pathname={pathname} contadores={contadores} compacto />
          ))}
        </nav>
      </header>
    </>
  )
}

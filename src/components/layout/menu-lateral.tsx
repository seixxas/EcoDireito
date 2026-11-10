'use client'

import { usePathname } from 'next/navigation'
import { Suspense } from 'react'
import { Logo } from '@/components/marca/logo'
import { Icone, type NomeIcone } from '@/components/ui/icone'
import { LinkRapido } from '@/components/ui/link-rapido'
import { cn } from '@/lib/cn'
import { pode, type Area, type Papel } from '@/lib/permissoes'
import { ListaFixados } from './fixados'

type Item = { href: string; rotulo: string; icone: NomeIcone; area: Area; tambem?: string[]; separado?: boolean }
export type UsuarioDoMenu = { nome: string; papel: Papel }

/** Ordem do desenho 3a (10/11). O Resumo também acende no Diário Oficial e na lista de prazos, que se abrem a partir dele. */
const ITENS: Item[] = [
  { href: '/', rotulo: 'Resumo', icone: 'home', area: 'prazos', tambem: ['/publicacoes', '/prazos'] },
  { href: '/projetos', rotulo: 'Projetos', icone: 'folder', area: 'prazos' },
  { href: '/comercial', rotulo: 'Propostas', icone: 'description', area: 'comercial' },
  { href: '/financeiro', rotulo: 'Financeiro', icone: 'payments', area: 'financeiro' },
  { href: '/usuarios', rotulo: 'Usuários', icone: 'group', area: 'usuarios', separado: true },
]

function ativo(pathname: string, { href, tambem = [] }: Item) {
  return [href, ...tambem].some((caminho) => pathname === caminho || (caminho !== '/' && pathname.startsWith(`${caminho}/`)))
}

/** Número vermelho ao lado de Projetos: prazos vencidos. */
function Contador({ valor }: { valor: number }) {
  return <span className="ml-auto inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-danger px-1.5 text-xs font-semibold text-white">{valor}</span>
}

function ItemDoMenu({ item, pathname, vencidos, compacto }: { item: Item; pathname: string; vencidos?: number; compacto?: boolean }) {
  const ligado = ativo(pathname, item)
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
      {item.href === '/projetos' && !!vencidos && <Contador valor={vencidos} />}
    </LinkRapido>
  )
}

/** O menu lê a URL; no Next 16 isso precisa de Suspense. Enquanto isso, mostra o menu sem item ativo. */
export function MenuLateral({ usuario, vencidos }: { usuario?: UsuarioDoMenu; vencidos?: number }) {
  return (
    <Suspense fallback={<Menu pathname="" usuario={usuario} vencidos={vencidos} />}>
      <MenuNaRota usuario={usuario} vencidos={vencidos} />
    </Suspense>
  )
}

function MenuNaRota({ usuario, vencidos }: { usuario?: UsuarioDoMenu; vencidos?: number }) {
  return <Menu pathname={usePathname()} usuario={usuario} vencidos={vencidos} />
}

function Menu({ pathname, usuario, vencidos }: { pathname: string; usuario?: UsuarioDoMenu; vencidos?: number }) {
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
            <div key={item.href} className={cn('contents', item.separado && '[&>a]:mt-5')}>
              <ItemDoMenu item={item} pathname={pathname} vencidos={vencidos} />
            </div>
          ))}
        </nav>
        {usuario && <ListaFixados />}
        <p className="mt-auto px-3 text-xs text-white/55">Dados fictícios para demonstração</p>
      </aside>

      <header className="bg-menu px-3 pb-2 pt-3 lg:hidden print:hidden">
        <LinkRapido href="/" className="mb-2 inline-block px-1">
          <Logo claro legenda={false} />
        </LinkRapido>
        <nav className="-mx-3 flex gap-1 overflow-x-auto px-3 pb-1">
          {itens.map((item) => (
            <ItemDoMenu key={item.href} item={item} pathname={pathname} vencidos={vencidos} compacto />
          ))}
        </nav>
      </header>
    </>
  )
}

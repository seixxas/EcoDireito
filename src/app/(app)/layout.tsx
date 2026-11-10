import { redirect } from 'next/navigation'
import { cache, Suspense, type ReactNode } from 'react'
import { MenuLateral } from '@/components/layout/menu-lateral'
import { Topo } from '@/components/layout/topo'
import { Carregando } from '@/components/ui/carregando'
import { hoje } from '@/data/hoje'
import { exigirUsuario } from '@/data/sessao'
import { pode } from '@/lib/permissoes'
import { contarPrazosVencidos } from './_resumo/prazos-vencidos'

/** A navegação entre as telas não mostra esqueleto de propósito: veja a fronteira abaixo. Isto desliga o aviso do Next em desenvolvimento. */
export const instant = false

/** Usuário e prazos vencidos, lidos uma vez por requisição: o menu (número em Projetos) e o topo (aviso vermelho) usam os dois. */
const dadosDaCasca = cache(async () => {
  const usuario = await exigirUsuario()
  if (usuario.papel === 'cliente') redirect('/portal')
  const vencidos = pode(usuario.papel, 'prazos') ? await contarPrazosVencidos(await hoje()) : 0
  return { usuario: { nome: usuario.nome, papel: usuario.papel }, vencidos }
})

async function MenuDoUsuario() {
  return <MenuLateral {...await dadosDaCasca()} />
}

async function TopoDoUsuario() {
  return <Topo {...await dadosDaCasca()} />
}

/** Desenho 3a (10/11): menu verde-escuro à esquerda, barra branca no topo, fundo branco. */
export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-canvas lg:flex">
      <Suspense fallback={<MenuLateral />}>
        <MenuDoUsuario />
      </Suspense>
      <div className="flex min-w-0 flex-1 flex-col">
        <Suspense fallback={<Topo />}>
          <TopoDoUsuario />
        </Suspense>
        <main className="surgir mx-auto w-full max-w-[120rem] min-w-0 px-3 pb-10 pt-4 lg:px-8 lg:pb-16 lg:pt-6">
          {/*
            Fronteira única, de propósito. Acima das páginas, ela só aparece ao abrir o site ou no F5: ao trocar de tela, o React mantém
            a tela atual até a nova ficar pronta. Uma fronteira por rota (loading.tsx) mostraria o esqueleto a cada clique, e o React segura
            um esqueleto por pelo menos 300 ms, mesmo com a resposta chegando antes. Quem avisa de uma espera longa é a barra do LinkRapido.
          */}
          <Suspense fallback={<Carregando />}>{children}</Suspense>
        </main>
      </div>
    </div>
  )
}

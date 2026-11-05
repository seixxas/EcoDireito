import { redirect } from 'next/navigation'
import { Suspense, type ReactNode } from 'react'
import { MenuLateral } from '@/components/layout/menu-lateral'
import { Carregando } from '@/components/ui/carregando'
import { exigirUsuario } from '@/data/sessao'

/** A navegação entre as telas não mostra esqueleto de propósito: veja a fronteira abaixo. Isto desliga o aviso do Next em desenvolvimento. */
export const instant = false

/** Lê o usuário dentro de Suspense (Cache Components); cliente não entra na área interna. */
async function MenuDoUsuario() {
  const usuario = await exigirUsuario()
  if (usuario.papel === 'cliente') redirect('/portal')
  return <MenuLateral usuario={{ nome: usuario.nome, papel: usuario.papel }} />
}

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div className="lg:flex">
      <Suspense fallback={<MenuLateral />}>
        <MenuDoUsuario />
      </Suspense>
      <main className="mx-auto w-full max-w-[120rem] min-w-0 px-4 py-6 lg:px-8 lg:py-8">
        {/*
          Fronteira única, de propósito. Acima das páginas, ela só aparece ao abrir o site ou no F5: ao trocar de tela, o React mantém
          a tela atual até a nova ficar pronta. Uma fronteira por rota (loading.tsx) mostraria o esqueleto a cada clique, e o React segura
          um esqueleto por pelo menos 300 ms, mesmo com a resposta chegando antes. Quem avisa de uma espera longa é a barra do LinkRapido.
        */}
        <Suspense fallback={<Carregando />}>{children}</Suspense>
      </main>
    </div>
  )
}

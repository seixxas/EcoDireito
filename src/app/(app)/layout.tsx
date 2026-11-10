import { redirect } from 'next/navigation'
import { cache, Suspense, type ReactNode } from 'react'
import { MenuLateral } from '@/components/layout/menu-lateral'
import { Topo } from '@/components/layout/topo'
import { Carregando } from '@/components/ui/carregando'
import { hoje } from '@/data/hoje'
import { exigirUsuario } from '@/data/sessao'
import { pode } from '@/lib/permissoes'
import { contarPublicacoesNovas } from './_resumo/cartao-diario'
import { contarPrazosVencidos } from './_resumo/prazos-vencidos'

/** A navegação entre as telas não mostra esqueleto de propósito: veja a fronteira abaixo. Isto desliga o aviso do Next em desenvolvimento. */
export const instant = false

/** Usuário, prazos vencidos e publicações sem revisão, lidos uma vez por requisição: o menu (números vermelhos) e o topo (aviso de vencidos) usam. */
const dadosDaCasca = cache(async () => {
  const usuario = await exigirUsuario()
  if (usuario.papel === 'cliente') redirect('/portal')
  const [vencidos, publicacoes] = pode(usuario.papel, 'prazos') ? await Promise.all([contarPrazosVencidos(await hoje()), contarPublicacoesNovas()]) : [0, 0]
  return { usuario: { nome: usuario.nome, papel: usuario.papel }, contadores: { vencidos, publicacoes } }
})

async function MenuDoUsuario() {
  const { usuario, contadores } = await dadosDaCasca()
  return <MenuLateral usuario={usuario} contadores={contadores} />
}

async function TopoDoUsuario() {
  const { usuario, contadores } = await dadosDaCasca()
  return <Topo usuario={usuario} vencidos={contadores.vencidos} />
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

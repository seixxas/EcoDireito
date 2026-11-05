import { redirect } from 'next/navigation'
import { Suspense, type ReactNode } from 'react'
import { MenuLateral } from '@/components/layout/menu-lateral'
import { exigirUsuario } from '@/data/sessao'

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
      <main className="mx-auto w-full max-w-[120rem] min-w-0 px-4 py-6 lg:px-8 lg:py-8">{children}</main>
    </div>
  )
}

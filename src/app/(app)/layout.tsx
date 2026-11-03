import type { ReactNode } from 'react'
import { MenuLateral } from '@/components/layout/menu-lateral'

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div className="lg:flex">
      <MenuLateral />
      <main className="mx-auto w-full max-w-[1440px] min-w-0 px-4 py-6 lg:px-10 lg:py-8">{children}</main>
    </div>
  )
}

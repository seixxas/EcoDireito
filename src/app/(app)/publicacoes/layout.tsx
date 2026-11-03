import type { ReactNode } from 'react'
import { AreaProtegida } from '@/components/layout/area-protegida'

export default function Layout({ children }: { children: ReactNode }) {
  return <AreaProtegida area="prazos">{children}</AreaProtegida>
}

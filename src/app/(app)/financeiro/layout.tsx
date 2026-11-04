import type { ReactNode } from 'react'
import { AreaProtegida } from '@/components/layout/area-protegida'
import { AbasDoFinanceiro } from './_components/abas-do-financeiro'

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <AreaProtegida area="financeiro">
      <AbasDoFinanceiro />
      {children}
    </AreaProtegida>
  )
}

import { Suspense, type ReactNode } from 'react'
import { Carregando } from '@/components/ui/carregando'
import { exigirArea } from '@/data/sessao'
import type { Area } from '@/lib/permissoes'

async function Guarda({ area, children }: { area: Area; children: ReactNode }) {
  await exigirArea(area)
  return children
}

/** Para usar no layout de uma área: quem não tem acesso volta para a sua tela inicial. */
export function AreaProtegida({ area, children }: { area: Area; children: ReactNode }) {
  return (
    <Suspense fallback={<Carregando />}>
      <Guarda area={area}>{children}</Guarda>
    </Suspense>
  )
}

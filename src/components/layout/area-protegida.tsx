import type { ReactNode } from 'react'
import { exigirArea } from '@/data/sessao'
import type { Area } from '@/lib/permissoes'

/**
 * Para usar no layout de uma área: quem não tem acesso volta para a sua tela inicial.
 * Sem Suspense próprio: uma fronteira nova mostraria o esqueleto ao entrar na área. Quem segura a espera é a do layout de `(app)`.
 */
export async function AreaProtegida({ area, children }: { area: Area; children: ReactNode }) {
  await exigirArea(area)
  return children
}

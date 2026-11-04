'use client'

import { usePathname } from 'next/navigation'
import { Suspense } from 'react'
import { Abas } from '@/components/ui/abas'

const ABAS = [
  { valor: '/financeiro', rotulo: 'Faturamento', href: '/financeiro' },
  { valor: '/financeiro/lancamentos', rotulo: 'Lançamentos', href: '/financeiro/lancamentos' },
  { valor: '/financeiro/extrato', rotulo: 'Extrato', href: '/financeiro/extrato' },
  { valor: '/financeiro/contratos', rotulo: 'Contratos', href: '/financeiro/contratos' },
  { valor: '/financeiro/fluxo', rotulo: 'Fluxo de caixa', href: '/financeiro/fluxo' },
  { valor: '/financeiro/dre', rotulo: 'DRE', href: '/financeiro/dre' },
  { valor: '/financeiro/lucratividade', rotulo: 'Lucratividade', href: '/financeiro/lucratividade' },
]

/** A aba mais específica que bate com a URL; o resto (notas, faturado × recebido) fica no Faturamento. */
function AbasNaRota() {
  const pathname = usePathname()
  const ativa = ABAS.slice(1).find(({ valor }) => pathname === valor || pathname.startsWith(`${valor}/`))
  return <Abas abas={ABAS} ativa={ativa?.valor ?? ABAS[0].valor} />
}

export function AbasDoFinanceiro() {
  return (
    <Suspense fallback={<Abas abas={ABAS} ativa="" />}>
      <AbasNaRota />
    </Suspense>
  )
}

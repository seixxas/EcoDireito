import { redirect } from 'next/navigation'
import type { NextRequest } from 'next/server'

/** Contas a receber virou a aba Atrasadas do Faturamento; link antigo continua valendo. */
export function GET(request: NextRequest) {
  const destino = new URLSearchParams({ aba: 'atrasadas' })
  for (const nome of ['q', 'faixa']) {
    const valor = request.nextUrl.searchParams.get(nome)
    if (valor) destino.set(nome, valor)
  }
  redirect(`/financeiro?${destino}`)
}

import { extratoDeExemplo } from '@/data/financeiro'
import { exigirArea } from '@/data/sessao'

/** "Baixar extrato de exemplo": OFX montado da base de hoje, para testar a importação e a conciliação. */
export async function GET() {
  await exigirArea('financeiro', 'editar')
  const { hoje, ofx } = await extratoDeExemplo()
  return new Response(ofx, {
    headers: {
      'Content-Type': 'application/x-ofx; charset=utf-8',
      'Content-Disposition': `attachment; filename="extrato-exemplo-${hoje}.ofx"`,
      'Cache-Control': 'no-store',
    },
  })
}

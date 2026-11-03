import { REGRAS_SVMA, calcularVencimento } from '@/domain/prazos'
import { SERIE_PARA_EVENTO, extrairDiasDoTexto, vincularAto } from '@/domain/publicacoes'
import { carregar } from './base'

export async function listarPublicacoes() {
  const { processos, clientes, publicacoes } = await carregar()

  const itens = publicacoes.atos.flatMap((ato) => {
    const vinculo = vincularAto(ato, processos, clientes)
    if (!vinculo) return []
    const evento = SERIE_PARA_EVENTO[ato.serie]
    const diasNoAto = extrairDiasDoTexto(ato.texto)
    return [
      {
        ato,
        vinculo,
        evento,
        cliente: clientes.find((c) => c.id === vinculo.clienteId)!,
        processo: processos.find((p) => p.id === vinculo.processoId),
        prazosSugeridos: REGRAS_SVMA.filter((regra) => regra.gatilho === evento).map((regra) => ({
          titulo: regra.titulo,
          tipo: regra.tipo,
          ...calcularVencimento(regra, ato.data, diasNoAto),
        })),
      },
    ]
  })

  return { edicao: publicacoes.edicao, itens }
}

export type PublicacaoNaCaixa = Awaited<ReturnType<typeof listarPublicacoes>>['itens'][number]

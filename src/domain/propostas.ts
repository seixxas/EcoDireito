import { diasEntre, somarDias, type DataISO } from '@/lib/datas'
import type { Centavos } from '@/lib/dinheiro'
import type { Processo, Servico, TipoEvento } from './processos'

/** A proposta é a fase 1 do processo: o texto do que será feito. O preço é o contrato (as parcelas). */
export type Proposta = {
  processoId: string
  escopo: string
  validadeDias: number
  criadaEm: DataISO
}

export const VALIDADE_PADRAO = 30

/** Proposta enviada sem resposta há mais que isso pede um retorno ao cliente. */
export const DIAS_PARA_RETORNO = 7

export const ESCOPO_PADRAO: Record<Servico, string> = {
  licenciamento:
    'Elaboração do projeto ambiental (levantamento arbóreo e planta de compensação), abertura do processo na Secretaria do Verde (SVMA) e acompanhamento até a publicação do TCA: vistoria, respostas aos Comunique-se, Câmara de Compensação Ambiental e cumprimento das cláusulas.',
  manejo: 'Pedido de manejo arbóreo na Secretaria do Verde (SVMA), aviso de início do manejo, acompanhamento do corte e entrega do relatório de manejo.',
}

/** Como a Eco Direito cobra cada serviço: a fração do total e o evento do processo que libera cada parcela. */
export const CONDICOES: Record<Servico, { descricao: string; fracao: number; gatilho: TipoEvento }[]> = {
  licenciamento: [
    { descricao: 'Parcela 1/3 · aceite da proposta', fracao: 0.3, gatilho: 'aceite_proposta' },
    { descricao: 'Parcela 2/3 · emissão do LAA', fracao: 0.3, gatilho: 'laa_emitido' },
    { descricao: 'Parcela 3/3 · publicação do TCA', fracao: 0.4, gatilho: 'tca_publicado' },
  ],
  manejo: [
    { descricao: 'Entrada (50%)', fracao: 0.5, gatilho: 'aceite_proposta' },
    { descricao: 'Término do corte (50%)', fracao: 0.5, gatilho: 'corte_concluido' },
  ],
}

/** Divide o total nas parcelas do serviço. A última fica com o arredondamento, então a soma sempre bate. */
export function parcelasDaProposta(servico: Servico, total: Centavos) {
  const condicoes = CONDICOES[servico]
  let resto = total
  return condicoes.map(({ descricao, fracao, gatilho }, i) => {
    const valor = i === condicoes.length - 1 ? resto : Math.round(total * fracao)
    resto -= valor
    return { descricao, valor, gatilho }
  })
}

export type EstadoProposta = 'elaboracao' | 'enviada' | 'aprovada' | 'recusada'

export const ESTADOS_PROPOSTA: Record<EstadoProposta, string> = {
  elaboracao: 'Em elaboração',
  enviada: 'Enviada',
  aprovada: 'Aprovada',
  recusada: 'Recusada',
}

/** Em que pé está a proposta, pelas etapas da fase 1. Vale a vez mais recente de cada etapa (proposta reenviada). */
export function situacaoDaProposta(processo: Processo, hoje: DataISO) {
  const ultima = (tipo: TipoEvento) => processo.eventos.filter((e) => e.tipo === tipo && e.data <= hoje).at(-1)
  const enviada = ultima('proposta_enviada')
  const aprovada = ultima('aceite_proposta')
  const recusada = ultima('proposta_recusada')
  const estado: EstadoProposta = recusada ? 'recusada' : aprovada ? 'aprovada' : enviada ? 'enviada' : 'elaboracao'
  const diasSemResposta = estado === 'enviada' && enviada ? diasEntre(enviada.data, hoje) : undefined
  return {
    estado,
    enviadaEm: enviada?.data,
    aprovadaEm: aprovada?.data,
    recusadaEm: recusada?.data,
    motivo: recusada?.observacao,
    diasSemResposta,
    pedeRetorno: diasSemResposta !== undefined && diasSemResposta > DIAS_PARA_RETORNO,
  }
}

export const propostaRecusada = (processo: Processo) => processo.eventos.some((e) => e.tipo === 'proposta_recusada')

export const validaAte = (proposta: Proposta) => somarDias(proposta.criadaEm, proposta.validadeDias)

const mediana = (numeros: number[]) => {
  if (!numeros.length) return undefined
  const ordenados = [...numeros].sort((a, b) => a - b)
  const meio = Math.floor(ordenados.length / 2)
  return ordenados.length % 2 ? ordenados[meio] : Math.round((ordenados[meio - 1] + ordenados[meio]) / 2)
}

type ItemDoFunil = { valor: Centavos; situacao: ReturnType<typeof situacaoDaProposta> }

/** Os números do Comercial. Conversão e tempo até aprovar olham as propostas decididas nos últimos 180 dias. */
export function numerosDoComercial(itens: ItemDoFunil[], hoje: DataISO) {
  const desde = somarDias(hoje, -180)
  const abertos = itens.filter((i) => i.situacao.estado === 'elaboracao' || i.situacao.estado === 'enviada')
  const aprovadas = itens.filter((i) => (i.situacao.aprovadaEm ?? '') >= desde && i.situacao.estado === 'aprovada')
  const recusadas = itens.filter((i) => (i.situacao.recusadaEm ?? '') >= desde)
  const decididas = aprovadas.length + recusadas.length
  return {
    emAberto: abertos.reduce((soma, i) => soma + i.valor, 0),
    quantasEmAberto: abertos.length,
    conversao: decididas ? Math.round((aprovadas.length / decididas) * 100) : undefined,
    diasAteAprovar: mediana(aprovadas.flatMap((i) => (i.situacao.enviadaEm && i.situacao.aprovadaEm ? [diasEntre(i.situacao.enviadaEm, i.situacao.aprovadaEm)] : []))),
    pedemRetorno: itens.filter((i) => i.situacao.pedeRetorno).length,
  }
}

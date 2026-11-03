import type { DataISO } from '@/lib/datas'
import type { Cliente, Processo, TipoEvento } from './processos'

/** Um ato do Diário Oficial, como vem no download do dia. */
export type Ato = {
  id: string
  data: DataISO
  orgao: string
  unidade: string
  serie: string
  /** Coluna "Processo" do diário: sempre um nº SEI. */
  processo: string
  documento: string
  texto: string
  /** Endereço do ato no DOC-SP. Muda a cada download: abre o ato, não o identifica. */
  link?: string
}

export const ORGAO_SVMA = 'Secretaria Municipal do Verde e do Meio Ambiente'

export const COMO_ACHOU = {
  sei: 'Nº SEI do processo',
  simproc: 'Nº SIMPROC antigo no texto',
  cnpj: 'CNPJ do cliente no texto',
} as const

export type ComoAchou = keyof typeof COMO_ACHOU

export type Vinculo = { comoAchou: ComoAchou; clienteId: string; processoId?: string }

const SERIE_PARA_EVENTO: Record<string, TipoEvento> = {
  'Comunique-se': 'comunique_se',
  'Despacho Autorizatório': 'parte_tecnica_aprovada',
}

/** Na série "Extrato" o DOC-SP publica o extrato do TCA e os dois certificados: só o começo do texto separa (visto nas edições de outubro/2026). */
const EXTRATOS: [RegExp, TipoEvento][] = [
  [/RECEBIMENTO DEFINITIVO/, 'certificado_definitivo'],
  [/RECEBIMENTO PROVIS[ÓO]RIO/, 'crp_emitido'],
  [/EXTRATO DO TERMO DE COMPROMISSO AMBIENTAL/, 'tca_publicado'],
]

/** O evento que o ato sugere ao ser confirmado, se houver. */
export function eventoDoAto(ato: Pick<Ato, 'serie' | 'texto'>): TipoEvento | undefined {
  if (ato.serie.startsWith('Extrato')) {
    const inicio = ato.texto.slice(0, 300).toUpperCase()
    return EXTRATOS.find(([padrao]) => padrao.test(inicio))?.[1]
  }
  return SERIE_PARA_EVENTO[ato.serie]
}

const SIMPROC = /\b\d{4}-0\.\d{3}\.\d{3}-\d\b/g
const CNPJ = /\d{2}\.?\d{3}\.?\d{3}\/?\d{4}-?\d{2}/g
const soDigitos = (texto: string) => texto.replace(/\D/g, '')

/** Liga um ato a um processo ou cliente: nº SEI, depois nº SIMPROC no texto, depois CNPJ no texto. */
export function vincularAto(ato: Ato, processos: Processo[], clientes: Cliente[]): Vinculo | undefined {
  if (ato.orgao !== ORGAO_SVMA) return

  const porSei = processos.find((p) => p.numeroSei === ato.processo)
  if (porSei) return { comoAchou: 'sei', clienteId: porSei.clienteId, processoId: porSei.id }

  const simprocs: string[] = ato.texto.match(SIMPROC) ?? []
  const porSimproc = processos.find((p) => p.numeroSimproc && simprocs.includes(p.numeroSimproc))
  if (porSimproc) return { comoAchou: 'simproc', clienteId: porSimproc.clienteId, processoId: porSimproc.id }

  const cnpjs = (ato.texto.match(CNPJ) ?? []).map(soDigitos)
  const cliente = clientes.find((c) => cnpjs.includes(soDigitos(c.documento)))
  if (cliente) return { comoAchou: 'cnpj', clienteId: cliente.id }
}

/**
 * Prazo que o próprio Comunique-se dá para responder: "no prazo de (até) 60 (sessenta) dias" → 60.
 * Em extrato e despacho, "N dias" costuma ser vigência ou validade e trocaria o prazo da cláusula por um maior.
 * "Dias úteis" é lido como corridos: isso só antecipa o vencimento.
 */
export function prazoDoAto(ato: Pick<Ato, 'serie' | 'texto'>) {
  if (eventoDoAto(ato) !== 'comunique_se') return undefined
  const achado = ato.texto.match(/prazo\s+de\s+(?:até\s+)?(\d+)\s*(?:\([^)]*\)\s*)?dias/i)
  return achado ? Number(achado[1]) : undefined
}

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
}

export const ORGAO_SVMA = 'Secretaria Municipal do Verde e do Meio Ambiente'

export const COMO_ACHOU = {
  sei: 'Nº SEI do processo',
  simproc: 'Nº SIMPROC antigo no texto',
  cnpj: 'CNPJ do cliente no texto',
} as const

export type ComoAchou = keyof typeof COMO_ACHOU

export type Vinculo = { comoAchou: ComoAchou; clienteId: string; processoId?: string }

export const SERIE_PARA_EVENTO: Record<string, TipoEvento> = {
  'Comunique-se': 'comunique_se',
  'Extrato do TCA': 'tca_publicado',
  'Despacho Autorizatório': 'parte_tecnica_aprovada',
  'Certificado de Recebimento Provisório': 'crp_emitido',
  'Certificado de Recebimento Definitivo': 'certificado_definitivo',
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

/** "no prazo de 60 (sessenta) dias" → 60 */
export function extrairDiasDoTexto(texto: string) {
  const achado = texto.match(/(\d+)\s*(?:\([^)]*\)\s*)?dias/i)
  return achado ? Number(achado[1]) : undefined
}

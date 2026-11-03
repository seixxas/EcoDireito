import type { DataISO } from '@/lib/datas'

/** As 7 fases do portal do cliente. Cada fase agrupa etapas do processo da SVMA. */
export const FASES = [
  { numero: 1, nome: 'Documentação', descricao: 'Organização dos documentos do projeto e do imóvel e abertura do processo.' },
  { numero: 2, nome: 'Análise', descricao: 'Guia de vistoria, vistoria e análise técnica da Secretaria do Verde.' },
  { numero: 3, nome: 'Resposta', descricao: 'Respostas aos Comunique-se até o parecer técnico conclusivo.' },
  { numero: 4, nome: 'Compromisso das Partes', descricao: 'Câmara de Compensação, TCA, cláusulas e Alvará de Execução.' },
  { numero: 5, nome: 'Manejo', descricao: 'Corte, poda ou transplante autorizado, com aviso e relatório.' },
  { numero: 6, nome: 'Construção', descricao: 'Acompanhamento ambiental durante a obra.' },
  { numero: 7, nome: 'Compensação', descricao: 'Plantio, CRP e manutenção até o certificado definitivo.' },
] as const

export type NumeroFase = (typeof FASES)[number]['numero']

export const EVENTOS = {
  aceite_proposta: { nome: 'Proposta aceita', fase: 1 },
  autuacao: { nome: 'Processo autuado na SVMA', fase: 1 },
  guia_emitida: { nome: 'Guia de vistoria emitida', fase: 2 },
  guia_paga: { nome: 'Guia paga e comprovante enviado', fase: 2 },
  vistoria_realizada: { nome: 'Vistoria realizada', fase: 2 },
  laa_emitido: { nome: 'LAA emitido', fase: 3 },
  comunique_se: { nome: 'Comunique-se publicado', fase: 3 },
  resposta_protocolada: { nome: 'Resposta ao Comunique-se protocolada', fase: 3 },
  parecer_conclusivo: { nome: 'Parecer técnico conclusivo', fase: 3 },
  parte_tecnica_aprovada: { nome: 'Parte técnica aprovada na Câmara', fase: 4 },
  tca_publicado: { nome: 'Extrato do TCA publicado', fase: 4 },
  clausula_93_cumprida: { nome: 'Cláusula 9.3 do TCA cumprida', fase: 4 },
  alvara_emitido: { nome: 'Alvará de Execução emitido', fase: 4 },
  alvara_protocolado: { nome: 'Alvará protocolado na SVMA', fase: 4 },
  compensacao_quitada: { nome: 'FEMA quitada ou mudas entregues', fase: 4 },
  corte_planejado: { nome: 'Corte planejado', fase: 5 },
  aviso_corte_enviado: { nome: 'Aviso de início do manejo enviado', fase: 5 },
  corte_concluido: { nome: 'Corte concluído', fase: 5 },
  relatorio_manejo_entregue: { nome: 'Relatório de manejo entregue', fase: 5 },
  obra_iniciada: { nome: 'Obra iniciada', fase: 6 },
  plantio_planejado: { nome: 'Plantio planejado', fase: 7 },
  aviso_plantio_enviado: { nome: 'Aviso de início do plantio enviado', fase: 7 },
  plantio_concluido: { nome: 'Plantio concluído', fase: 7 },
  relatorio_plantio_entregue: { nome: 'Relatório fotográfico do plantio entregue', fase: 7 },
  crp_emitido: { nome: 'CRP emitido', fase: 7 },
  certificado_definitivo: { nome: 'Certificado de Recebimento Definitivo', fase: 7 },
} as const satisfies Record<string, { nome: string; fase: NumeroFase }>

export type TipoEvento = keyof typeof EVENTOS

export type Evento = {
  id: string
  tipo: TipoEvento
  data: DataISO
  origem: 'diario' | 'manual'
  /** Prazo escrito no próprio ato ("60 dias"), quando diferente do padrão. */
  diasNoAto?: number
}

export type Servico = 'licenciamento' | 'manejo'

export type Cliente = {
  id: string
  nome: string
  /** CNPJ (empresa) ou CPF (pessoa física). */
  documento: string
  /** Incorporadora dona da SPE. */
  grupo?: string
}

export type Processo = {
  id: string
  clienteId: string
  empreendimento: string
  endereco: string
  responsavel: string
  servico: Servico
  numeroSei: string
  numeroSimproc?: string
  numeroTca?: string
  faseAtual: NumeroFase
  eventos: Evento[]
}

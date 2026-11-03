import type { DataISO } from '@/lib/datas'

/** As 8 fases, as mesmas do portal do cliente. Cada fase é uma lista de etapas (os eventos dela). */
export const FASES = [
  { numero: 1, nome: 'Proposta', descricao: 'Proposta enviada ao cliente e orçamento aprovado.' },
  { numero: 2, nome: 'Documentação', descricao: 'Projeto ambiental, documentos do cliente e abertura do processo na Secretaria do Verde.' },
  { numero: 3, nome: 'Análise', descricao: 'Guia de vistoria, pagamento da guia e vistoria da Secretaria do Verde.' },
  { numero: 4, nome: 'Resposta', descricao: 'Se a vistoria achar pendências, a SVMA publica um Comunique-se e a Eco Direito responde. Termina com o LAA.' },
  { numero: 5, nome: 'Compromisso das Partes', descricao: 'Câmara de Compensação, TCA, cláusulas e Alvará de Execução.' },
  { numero: 6, nome: 'Manejo', descricao: 'Corte, poda ou transplante autorizado, com aviso e relatório.' },
  { numero: 7, nome: 'Construção', descricao: 'Obra do empreendimento, até a conclusão.' },
  { numero: 8, nome: 'Compensação', descricao: 'Plantio, CRP e manutenção até o certificado definitivo.' },
] as const

export type NumeroFase = (typeof FASES)[number]['numero']

export type InfoEvento = {
  nome: string
  fase: NumeroFase
  /** Quem faz a etapa acontecer. */
  quem: string
  /** O robô acha o ato no Diário Oficial; confirmar na caixa de entrada lança a etapa. */
  diario?: true
  /** Etapa que encerra a fase: marcada, o processo passa para a fase seguinte. */
  fecha?: true
  /** Etapa que só existe em alguns processos, e quando ela acontece. */
  quando?: string
  /** Pode acontecer mais de uma vez (um Comunique-se depois do outro). */
  repete?: true
  /** A data é a planejada: lançada antes de acontecer, para contar a antecedência. */
  planejada?: true
  /** O ato pode dar um prazo diferente do padrão ("60 dias"). */
  prazoNoAto?: true
  ajuda?: string
}

const DEFINICAO = {
  proposta_enviada: { nome: 'Proposta enviada ao cliente', fase: 1, quem: 'Eco Direito' },
  aceite_proposta: { nome: 'Orçamento aprovado pelo cliente', fase: 1, quem: 'Cliente', fecha: true },
  proposta_recusada: {
    nome: 'Proposta recusada pelo cliente',
    fase: 1,
    quem: 'Cliente',
    quando: 'só se o cliente recusar',
    ajuda: 'Escreva o motivo na observação. A proposta sai da lista de processos e fica no Comercial, entre as recusadas.',
  },
  projeto_elaborado: { nome: 'Projeto ambiental elaborado', fase: 2, quem: 'Eco Direito' },
  documentacao_recebida: { nome: 'Documentação do cliente recebida', fase: 2, quem: 'Cliente' },
  autuacao: { nome: 'Processo aberto na SVMA (autuação)', fase: 2, quem: 'Eco Direito', fecha: true, ajuda: 'A SVMA gera o nº SEI, que o robô usa para achar o processo no Diário Oficial.' },
  guia_emitida: { nome: 'Guia de vistoria emitida', fase: 3, quem: 'SVMA' },
  guia_paga: { nome: 'Guia paga e comprovante enviado', fase: 3, quem: 'Cliente paga, Eco Direito envia' },
  vistoria_realizada: { nome: 'Vistoria realizada', fase: 3, quem: 'SVMA', fecha: true },
  comunique_se: { nome: 'Comunique-se publicado', fase: 4, quem: 'SVMA', diario: true, quando: 'só se a SVMA achar pendência', repete: true, prazoNoAto: true },
  resposta_protocolada: { nome: 'Resposta ao Comunique-se protocolada', fase: 4, quem: 'Eco Direito', quando: 'só se houver Comunique-se', repete: true },
  laa_emitido: {
    nome: 'LAA e parecer técnico emitidos',
    fase: 4,
    quem: 'SVMA',
    fecha: true,
    ajuda: 'Laudo de Avaliação Ambiental com as plantas aprovadas. Sai logo depois da vistoria, se estiver tudo certo, ou depois da resposta ao último Comunique-se.',
  },
  parte_tecnica_aprovada: { nome: 'Parte técnica aprovada (despacho autorizatório)', fase: 5, quem: 'SVMA', diario: true },
  tca_publicado: { nome: 'Extrato do TCA publicado', fase: 5, quem: 'Câmara de Compensação', diario: true },
  clausula_93_cumprida: { nome: 'Cláusula 9.3 do TCA cumprida', fase: 5, quem: 'Eco Direito' },
  alvara_emitido: { nome: 'Alvará de Execução emitido', fase: 5, quem: 'SMUL (Urbanismo)', ajuda: 'É a cláusula 9.5 do TCA.' },
  alvara_protocolado: { nome: 'Alvará protocolado na SVMA', fase: 5, quem: 'Eco Direito', fecha: true },
  compensacao_quitada: {
    nome: 'FEMA quitada ou mudas entregues',
    fase: 5,
    quem: 'Cliente e Eco Direito',
    ajuda: 'Corre em paralelo: são 6 meses a partir do protocolo do Alvará, mesmo com o processo já no manejo.',
  },
  corte_planejado: { nome: 'Data do corte marcada', fase: 6, quem: 'Eco Direito', planejada: true, ajuda: 'Use a data em que o corte vai acontecer: o aviso vence 10 dias antes.' },
  aviso_corte_enviado: { nome: 'Aviso de início do manejo enviado', fase: 6, quem: 'Eco Direito' },
  corte_concluido: { nome: 'Corte concluído', fase: 6, quem: 'Eco Direito' },
  relatorio_manejo_entregue: { nome: 'Relatório de manejo entregue', fase: 6, quem: 'Eco Direito', fecha: true },
  obra_iniciada: { nome: 'Obra iniciada', fase: 7, quem: 'Cliente' },
  obra_concluida: { nome: 'Obra concluída', fase: 7, quem: 'Cliente', fecha: true },
  plantio_planejado: { nome: 'Data do plantio marcada', fase: 8, quem: 'Eco Direito', planejada: true, ajuda: 'Use a data em que o plantio vai acontecer: o aviso vence 10 dias antes.' },
  aviso_plantio_enviado: { nome: 'Aviso de início do plantio enviado', fase: 8, quem: 'Eco Direito' },
  plantio_concluido: { nome: 'Plantio concluído', fase: 8, quem: 'Eco Direito' },
  relatorio_plantio_entregue: { nome: 'Relatório fotográfico do plantio entregue', fase: 8, quem: 'Eco Direito' },
  crp_emitido: { nome: 'CRP emitido (vistoria de verificação)', fase: 8, quem: 'SVMA', diario: true },
  certificado_definitivo: { nome: 'Certificado de Recebimento Definitivo', fase: 8, quem: 'SVMA', diario: true, fecha: true, ajuda: 'Encerra o processo.' },
} as const satisfies Record<string, InfoEvento>

export type TipoEvento = keyof typeof DEFINICAO

export const EVENTOS: Record<TipoEvento, InfoEvento> = DEFINICAO

export const TIPOS_EVENTO = Object.keys(EVENTOS) as [TipoEvento, ...TipoEvento[]]

/**
 * A fase avança do mesmo jeito para evento lançado à mão ou confirmado do Diário Oficial:
 * - a etapa que fecha a fase leva o processo para a fase seguinte;
 * - uma etapa de fase mais adiante leva o processo até ela (quando a etapa final de antes não foi registrada).
 * Evento planejado não muda a fase, e o processo nunca volta de fase sozinho.
 */
export function faseDepoisDoEvento(faseAtual: NumeroFase, evento: { tipo: TipoEvento; data: DataISO }, hoje: DataISO): NumeroFase {
  if (evento.data > hoje) return faseAtual
  const { fase, fecha } = EVENTOS[evento.tipo]
  const alvo = fecha && fase < FASES.length ? fase + 1 : fase
  return Math.max(faseAtual, alvo) as NumeroFase
}

export type Evento = {
  id: string
  tipo: TipoEvento
  data: DataISO
  origem: 'diario' | 'manual'
  /** Prazo escrito no próprio ato ("60 dias"), quando diferente do padrão. */
  diasNoAto?: number
  observacao?: string
}

export type Etapa = {
  tipo: TipoEvento
  info: InfoEvento
  /** Vezes em que a etapa já aconteceu, da mais antiga para a mais recente. */
  feitos: Evento[]
  /** Datas marcadas para a frente. */
  planejados: Evento[]
}

/** O checklist de uma fase: cada etapa com o que já aconteceu. */
export function etapasDaFase(processo: Processo, fase: NumeroFase, hoje: DataISO): Etapa[] {
  const eventos = [...processo.eventos].sort((a, b) => a.data.localeCompare(b.data))
  return TIPOS_EVENTO.filter((tipo) => EVENTOS[tipo].fase === fase).map((tipo) => {
    const daEtapa = eventos.filter((e) => e.tipo === tipo)
    return { tipo, info: EVENTOS[tipo], feitos: daEtapa.filter((e) => e.data <= hoje), planejados: daEtapa.filter((e) => e.data > hoje) }
  })
}

export type SituacaoFase = 'concluida' | 'atual' | 'futura'

/** A fase atual só aparece como concluída quando é a última e a etapa final já aconteceu (processo encerrado). */
export function situacaoDaFase(processo: Processo, fase: NumeroFase, hoje: DataISO): SituacaoFase {
  if (fase < processo.faseAtual) return 'concluida'
  if (fase > processo.faseAtual) return 'futura'
  return fase === FASES.length && conclusaoDaFase(processo, fase, hoje) ? 'concluida' : 'atual'
}

/** Data em que a etapa que fecha a fase aconteceu, se foi registrada. */
export function conclusaoDaFase(processo: Processo, fase: NumeroFase, hoje: DataISO): DataISO | undefined {
  return processo.eventos
    .filter((e) => EVENTOS[e.tipo].fase === fase && EVENTOS[e.tipo].fecha && e.data <= hoje)
    .map((e) => e.data)
    .sort()[0]
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
  /** Só existe depois da abertura do processo na SVMA (autuação). */
  numeroSei?: string
  numeroSimproc?: string
  numeroTca?: string
  faseAtual: NumeroFase
  eventos: Evento[]
}

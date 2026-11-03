import { diasEntre, somarDias, somarMeses, type DataISO } from '@/lib/datas'
import { formatarData } from '@/lib/formatar'
import { diaUtilAnterior, motivoSemExpediente, proximoDiaUtil, somarDiasUteis } from './feriados'
import type { Evento, NumeroFase, Processo, TipoEvento } from './processos'

export const TIPOS_PRAZO = {
  obrigacao: 'Obrigação',
  expectativa: 'Expectativa do órgão',
  antecedencia: 'Antecedência',
  validade: 'Validade',
} as const

export type TipoPrazo = keyof typeof TIPOS_PRAZO

export type RegraPrazo = {
  id: string
  titulo: string
  tipo: TipoPrazo
  gatilho: TipoEvento
  quantidade: number
  unidade: 'dias_corridos' | 'dias_uteis' | 'meses'
  /** 'antes' = antecedência: conta para trás a partir da data planejada. */
  direcao?: 'antes'
  /** Ajuste final em dias, para "18 meses, pedir 30 dias antes". */
  ajusteDias?: number
  /** Evento que dá o prazo por cumprido. */
  cumpridoPor: TipoEvento
  fase: NumeroFase
  baseLegal: string
}

/** Regras do processo de manejo com TCA na SVMA. Fonte: passo a passo + Portaria SVMA 105/2024. */
export const REGRAS_SVMA: RegraPrazo[] = [
  { id: 'guia-emissao', titulo: 'SVMA emitir a guia de vistoria', tipo: 'expectativa', gatilho: 'autuacao', quantidade: 15, unidade: 'dias_corridos', cumpridoPor: 'guia_emitida', fase: 2, baseLegal: 'Passo a passo Eco Direito (5 a 15 dias)' },
  { id: 'guia-pagamento', titulo: 'Pagar a guia e enviar o comprovante', tipo: 'obrigacao', gatilho: 'guia_emitida', quantidade: 30, unidade: 'dias_corridos', cumpridoPor: 'guia_paga', fase: 2, baseLegal: 'Passo a passo Eco Direito' },
  { id: 'vistoria', titulo: 'SVMA fazer a primeira vistoria', tipo: 'expectativa', gatilho: 'guia_paga', quantidade: 60, unidade: 'dias_corridos', cumpridoPor: 'vistoria_realizada', fase: 2, baseLegal: 'Passo a passo Eco Direito (45 a 60 dias)' },
  { id: 'comunique-se', titulo: 'Responder o Comunique-se', tipo: 'obrigacao', gatilho: 'comunique_se', quantidade: 30, unidade: 'dias_corridos', cumpridoPor: 'resposta_protocolada', fase: 3, baseLegal: 'Lei Municipal 14.141/2006, art. 40' },
  { id: 'parecer-validade', titulo: 'Pedir renovação do parecer técnico', tipo: 'validade', gatilho: 'parecer_conclusivo', quantidade: 18, unidade: 'meses', ajusteDias: -30, cumpridoPor: 'tca_publicado', fase: 3, baseLegal: 'Portaria SVMA 105/2024, art. 19' },
  { id: 'tca-emissao', titulo: 'Câmara de Compensação publicar o TCA', tipo: 'expectativa', gatilho: 'parte_tecnica_aprovada', quantidade: 6, unidade: 'meses', cumpridoPor: 'tca_publicado', fase: 4, baseLegal: 'Passo a passo Eco Direito (4 a 6 meses)' },
  { id: 'clausula-93', titulo: 'Cumprir a cláusula 9.3 do TCA', tipo: 'obrigacao', gatilho: 'tca_publicado', quantidade: 30, unidade: 'dias_corridos', cumpridoPor: 'clausula_93_cumprida', fase: 4, baseLegal: 'TCA, cláusula 9.3' },
  { id: 'alvara-obter', titulo: 'Obter o Alvará de Execução (senão o TCA é rescindido)', tipo: 'validade', gatilho: 'tca_publicado', quantidade: 24, unidade: 'meses', cumpridoPor: 'alvara_emitido', fase: 4, baseLegal: 'Portaria SVMA 105/2024, art. 53' },
  { id: 'alvara-protocolo', titulo: 'Protocolar o Alvará de Execução na SVMA', tipo: 'obrigacao', gatilho: 'alvara_emitido', quantidade: 30, unidade: 'dias_corridos', cumpridoPor: 'alvara_protocolado', fase: 4, baseLegal: 'Portaria SVMA 105/2024, art. 51, §2º (conta da emissão)' },
  { id: 'compensacao', titulo: 'Quitar a FEMA ou entregar as mudas', tipo: 'obrigacao', gatilho: 'alvara_protocolado', quantidade: 6, unidade: 'meses', cumpridoPor: 'compensacao_quitada', fase: 4, baseLegal: 'TCA, cláusula 9.5' },
  { id: 'aviso-corte', titulo: 'Enviar o aviso de início do manejo', tipo: 'antecedencia', gatilho: 'corte_planejado', quantidade: 10, unidade: 'dias_corridos', direcao: 'antes', cumpridoPor: 'aviso_corte_enviado', fase: 5, baseLegal: 'Passo a passo Eco Direito' },
  { id: 'relatorio-manejo', titulo: 'Entregar o relatório de manejo', tipo: 'obrigacao', gatilho: 'corte_concluido', quantidade: 20, unidade: 'dias_corridos', cumpridoPor: 'relatorio_manejo_entregue', fase: 5, baseLegal: 'Portaria SVMA 105/2024, art. 57, §1º (passo a passo diz 30)' },
  { id: 'aviso-plantio', titulo: 'Enviar o aviso de início do plantio', tipo: 'antecedencia', gatilho: 'plantio_planejado', quantidade: 10, unidade: 'dias_corridos', direcao: 'antes', cumpridoPor: 'aviso_plantio_enviado', fase: 7, baseLegal: 'Passo a passo Eco Direito' },
  { id: 'relatorio-plantio', titulo: 'Entregar o relatório fotográfico do plantio', tipo: 'obrigacao', gatilho: 'plantio_concluido', quantidade: 30, unidade: 'dias_corridos', cumpridoPor: 'relatorio_plantio_entregue', fase: 7, baseLegal: 'Passo a passo Eco Direito' },
  { id: 'manutencao', titulo: 'Manutenção do plantio até o certificado definitivo', tipo: 'validade', gatilho: 'crp_emitido', quantidade: 6, unidade: 'meses', cumpridoPor: 'certificado_definitivo', fase: 7, baseLegal: 'Passo a passo Eco Direito' },
]

export type Prazo = {
  id: string
  processoId: string
  regra: RegraPrazo
  evento: Evento
  vencimento: DataISO
  /** Como a data foi calculada, em português, para mostrar na tela. */
  explicacao: string
  cumpridoEm?: DataISO
}

export function calcularVencimento(regra: RegraPrazo, inicio: DataISO, diasNoAto?: number) {
  const quantidade = regra.unidade === 'dias_corridos' && diasNoAto ? diasNoAto : regra.quantidade
  const doAto = quantidade !== regra.quantidade ? ' (prazo escrito no ato)' : ''

  if (regra.unidade === 'dias_uteis') {
    return {
      vencimento: somarDiasUteis(inicio, quantidade),
      explicacao: `${quantidade} dias úteis a partir de ${formatarData(inicio)}`,
    }
  }

  const antecipa = regra.direcao === 'antes' || (regra.ajusteDias ?? 0) < 0
  const bruto =
    regra.unidade === 'meses'
      ? somarDias(somarMeses(inicio, quantidade), regra.ajusteDias ?? 0)
      : somarDias(inicio, regra.direcao === 'antes' ? -quantidade : quantidade)
  const vencimento = antecipa ? diaUtilAnterior(bruto) : proximoDiaUtil(bruto)

  const base =
    regra.unidade === 'meses'
      ? `${quantidade} meses${regra.ajusteDias ? ` menos ${-regra.ajusteDias} dias` : ''} a partir de ${formatarData(inicio)}`
      : regra.direcao === 'antes'
        ? `${quantidade} dias antes de ${formatarData(inicio)}`
        : `${quantidade} dias corridos${doAto} a partir de ${formatarData(inicio)}`
  const ajuste =
    bruto === vencimento
      ? ''
      : `; ${formatarData(bruto)} é ${motivoSemExpediente(bruto)}, então ${antecipa ? 'antecipa para o dia útil anterior' : 'passa para o próximo dia útil'}`

  return { vencimento, explicacao: base + ajuste }
}

/** Aplica as regras a todos os eventos do processo. Cada evento que cumpre só fecha um prazo. */
export function gerarPrazos(processo: Processo, regras = REGRAS_SVMA): Prazo[] {
  const eventos = [...processo.eventos].sort((a, b) => a.data.localeCompare(b.data))
  const prazos: Prazo[] = []

  for (const regra of regras) {
    const usados = new Set<string>()
    for (const evento of eventos) {
      if (evento.tipo !== regra.gatilho) continue
      const cumprimento = eventos.find(
        (e) => e.tipo === regra.cumpridoPor && e.data >= evento.data && !usados.has(e.id),
      )
      if (cumprimento) usados.add(cumprimento.id)
      prazos.push({
        id: `${evento.id}:${regra.id}`,
        processoId: processo.id,
        regra,
        evento,
        ...calcularVencimento(regra, evento.data, evento.diasNoAto),
        cumpridoEm: cumprimento?.data,
      })
    }
  }

  return prazos.sort((a, b) => a.vencimento.localeCompare(b.vencimento))
}

export const DIAS_ALERTA = 10

export type SituacaoPrazo = 'cumprido' | 'vencido' | 'hoje' | 'proximo' | 'no_prazo'

export function situacaoPrazo(prazo: Prazo, hoje: DataISO): { situacao: SituacaoPrazo; dias: number } {
  const dias = diasEntre(hoje, prazo.vencimento)
  if (prazo.cumpridoEm && prazo.cumpridoEm <= hoje) return { situacao: 'cumprido', dias }
  if (dias < 0) return { situacao: 'vencido', dias }
  if (dias === 0) return { situacao: 'hoje', dias }
  return { situacao: dias <= DIAS_ALERTA ? 'proximo' : 'no_prazo', dias }
}

export function estaAberto(prazo: Prazo, hoje: DataISO) {
  return situacaoPrazo(prazo, hoje).situacao !== 'cumprido'
}

/** Prazo da Eco Direito (não do órgão) que vence primeiro. */
export function proximoPrazo(prazos: Prazo[], hoje: DataISO) {
  return prazos.find((p) => p.regra.tipo !== 'expectativa' && estaAberto(p, hoje))
}

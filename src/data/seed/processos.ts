import { somarDias, type DataISO } from '@/lib/datas'
import { reais } from '@/lib/dinheiro'
import type { Contrato } from '@/domain/financeiro/parcelas'
import type { Evento, Processo, TipoEvento } from '@/domain/processos'

/** Eventos que saem no Diário Oficial; o resto é lançado pela equipe. */
const DO_DIARIO = new Set<TipoEvento>(['comunique_se', 'parecer_conclusivo', 'parte_tecnica_aprovada', 'tca_publicado', 'crp_emitido', 'certificado_definitivo'])

/** Processos cuja última parcela liberada ainda não foi faturada (destaque da demonstração). */
export const PARCELA_A_FATURAR = new Set(['p02', 'p10'])

type Linha = [TipoEvento, number] | [TipoEvento, number, number]

/** Os dias são relativos a hoje: -24 = 24 dias atrás. */
const CASOS: (Omit<Processo, 'eventos'> & { valor: number; linhas: Linha[] })[] = [
  {
    id: 'p01', clienteId: 'altavista-pinheiros', empreendimento: 'Residencial Altavista Pinheiros', endereco: 'Rua Cardeal Arcoverde, 1.480 · Pinheiros',
    responsavel: 'Juliana Prado', servico: 'licenciamento', numeroSei: '6027.2026/0003127-4', faseAtual: 3, valor: 64_000,
    linhas: [['aceite_proposta', -212], ['autuacao', -205], ['guia_emitida', -196], ['guia_paga', -183], ['vistoria_realizada', -128], ['laa_emitido', -96], ['comunique_se', -61], ['resposta_protocolada', -40], ['comunique_se', -24]],
  },
  {
    id: 'p02', clienteId: 'horizonte-moema', empreendimento: 'Edifício Horizonte Moema', endereco: 'Alameda dos Arapanés, 920 · Moema',
    responsavel: 'Rafael Moura', servico: 'licenciamento', numeroSei: '6027.2025/0011842-0', numeroTca: '231/2026', faseAtual: 4, valor: 120_000,
    linhas: [['aceite_proposta', -430], ['autuacao', -421], ['guia_emitida', -410], ['guia_paga', -396], ['vistoria_realizada', -333], ['laa_emitido', -301], ['comunique_se', -282], ['resposta_protocolada', -256], ['parecer_conclusivo', -205], ['parte_tecnica_aprovada', -152], ['tca_publicado', -20]],
  },
  {
    id: 'p03', clienteId: 'vertice-brooklin', empreendimento: 'Vértice Brooklin Residence', endereco: 'Rua Joaquim Nabuco, 615 · Brooklin',
    responsavel: 'Juliana Prado', servico: 'licenciamento', numeroSei: '6027.2024/0021903-6', numeroTca: '412/2025', faseAtual: 5, valor: 88_000,
    linhas: [['aceite_proposta', -720], ['autuacao', -710], ['guia_emitida', -700], ['guia_paga', -688], ['vistoria_realizada', -630], ['laa_emitido', -590], ['comunique_se', -560], ['resposta_protocolada', -540], ['parecer_conclusivo', -470], ['parte_tecnica_aprovada', -400], ['tca_publicado', -305], ['clausula_93_cumprida', -284], ['alvara_emitido', -210], ['alvara_protocolado', -192], ['compensacao_quitada', -63], ['corte_planejado', 12]],
  },
  {
    id: 'p04', clienteId: 'serra-azul-lapa', empreendimento: 'Residencial Serra Azul Lapa', endereco: 'Rua Guaicurus, 1.102 · Lapa',
    responsavel: 'Rafael Moura', servico: 'licenciamento', numeroSei: '6027.2023/0017265-9', numeroTca: '096/2024', faseAtual: 7, valor: 145_000,
    linhas: [['aceite_proposta', -1050], ['autuacao', -1040], ['guia_emitida', -1030], ['guia_paga', -1012], ['vistoria_realizada', -950], ['laa_emitido', -905], ['comunique_se', -880], ['resposta_protocolada', -858], ['parecer_conclusivo', -800], ['parte_tecnica_aprovada', -730], ['tca_publicado', -650], ['clausula_93_cumprida', -628], ['alvara_emitido', -560], ['alvara_protocolado', -545], ['compensacao_quitada', -420], ['aviso_corte_enviado', -418], ['corte_planejado', -405], ['corte_concluido', -400], ['relatorio_manejo_entregue', -386], ['obra_iniciada', -380], ['aviso_plantio_enviado', -52], ['plantio_planejado', -40], ['plantio_concluido', -25]],
  },
  {
    id: 'p05', clienteId: 'jequitiba-morumbi', empreendimento: 'Jequitibá Morumbi Parque', endereco: 'Rua Itapaiúna, 2.050 · Morumbi',
    responsavel: 'Marina Lopes', servico: 'licenciamento', numeroSei: '6027.2026/0014590-1', faseAtual: 2, valor: 52_000,
    linhas: [['aceite_proposta', -48], ['autuacao', -42], ['guia_emitida', -30]],
  },
  {
    id: 'p06', clienteId: 'lumen-vila-olimpia', empreendimento: 'Lumen Vila Olímpia Offices', endereco: 'Rua Gomes de Carvalho, 1.390 · Vila Olímpia',
    responsavel: 'Rafael Moura', servico: 'licenciamento', numeroSei: '6027.2025/0024417-3', faseAtual: 3, valor: 76_000,
    linhas: [['aceite_proposta', -268], ['autuacao', -259], ['guia_emitida', -249], ['guia_paga', -231], ['vistoria_realizada', -160], ['laa_emitido', -118], ['comunique_se', -34]],
  },
  {
    id: 'p07', clienteId: 'horizonte-perdizes', empreendimento: 'Horizonte Perdizes Vista', endereco: 'Rua Cardoso de Almeida, 1.755 · Perdizes',
    responsavel: 'Marina Lopes', servico: 'licenciamento', numeroSei: '6027.2025/0008813-2', numeroTca: '158/2026', faseAtual: 4, valor: 98_000,
    linhas: [['aceite_proposta', -520], ['autuacao', -511], ['guia_emitida', -500], ['guia_paga', -485], ['vistoria_realizada', -420], ['laa_emitido', -390], ['comunique_se', -365], ['resposta_protocolada', -340], ['parecer_conclusivo', -290], ['parte_tecnica_aprovada', -230], ['tca_publicado', -124], ['clausula_93_cumprida', -103], ['alvara_emitido', -22]],
  },
  {
    id: 'p08', clienteId: 'altavista-vila-mariana', empreendimento: 'Altavista Vila Mariana', endereco: 'Rua Domingos de Morais, 2.240 · Vila Mariana',
    responsavel: 'Juliana Prado', servico: 'licenciamento', numeroSei: '6027.2026/0017702-5', faseAtual: 1, valor: 58_000,
    linhas: [['aceite_proposta', -36], ['autuacao', -26]],
  },
  {
    id: 'p09', clienteId: 'vertice-santana', empreendimento: 'Vértice Santana Garden', endereco: 'Rua Voluntários da Pátria, 3.310 · Santana',
    responsavel: 'Rafael Moura', servico: 'licenciamento', numeroSei: '6027.2024/0009184-7', numeroTca: '275/2025', faseAtual: 6, valor: 110_000,
    linhas: [['aceite_proposta', -880], ['autuacao', -870], ['guia_emitida', -860], ['guia_paga', -846], ['vistoria_realizada', -790], ['laa_emitido', -750], ['comunique_se', -720], ['resposta_protocolada', -700], ['parecer_conclusivo', -640], ['parte_tecnica_aprovada', -560], ['tca_publicado', -480], ['clausula_93_cumprida', -458], ['alvara_emitido', -390], ['alvara_protocolado', -372], ['compensacao_quitada', -250], ['aviso_corte_enviado', -228], ['corte_planejado', -215], ['corte_concluido', -205], ['relatorio_manejo_entregue', -188], ['obra_iniciada', -180], ['plantio_planejado', 40]],
  },
  {
    id: 'p10', clienteId: 'bom-preco', empreendimento: 'Loja Bom Preço Vila Leopoldina', endereco: 'Av. Imperatriz Leopoldina, 1.900 · Vila Leopoldina',
    responsavel: 'Marina Lopes', servico: 'manejo', numeroSei: '6027.2026/0002291-8', faseAtual: 5, valor: 46_000,
    linhas: [['aceite_proposta', -150], ['autuacao', -141], ['guia_emitida', -131], ['guia_paga', -118], ['vistoria_realizada', -88], ['aviso_corte_enviado', -37], ['corte_planejado', -24], ['corte_concluido', -15]],
  },
  {
    id: 'p11', clienteId: 'jequitiba-campo-belo', empreendimento: 'Jequitibá Campo Belo', endereco: 'Rua Vieira de Morais, 880 · Campo Belo',
    responsavel: 'Juliana Prado', servico: 'licenciamento', numeroSei: '6027.2024/0026631-4', faseAtual: 4, valor: 132_000,
    linhas: [['aceite_proposta', -650], ['autuacao', -641], ['guia_emitida', -630], ['guia_paga', -615], ['vistoria_realizada', -575], ['laa_emitido', -548], ['comunique_se', -540], ['resposta_protocolada', -522], ['parecer_conclusivo', -510], ['parte_tecnica_aprovada', -128]],
  },
  {
    id: 'p12', clienteId: 'serra-azul-ipiranga', empreendimento: 'Serra Azul Ipiranga', endereco: 'Rua Silva Bueno, 1.640 · Ipiranga',
    responsavel: 'Marina Lopes', servico: 'licenciamento', numeroSei: '6027.2023/0019920-5', numeroTca: '133/2024', faseAtual: 7, valor: 96_000,
    linhas: [['aceite_proposta', -1100], ['autuacao', -1090], ['guia_emitida', -1080], ['guia_paga', -1066], ['vistoria_realizada', -1000], ['laa_emitido', -960], ['comunique_se', -930], ['resposta_protocolada', -905], ['parecer_conclusivo', -850], ['parte_tecnica_aprovada', -780], ['tca_publicado', -700], ['clausula_93_cumprida', -680], ['alvara_emitido', -610], ['alvara_protocolado', -596], ['compensacao_quitada', -470], ['aviso_corte_enviado', -452], ['corte_planejado', -440], ['corte_concluido', -432], ['relatorio_manejo_entregue', -414], ['obra_iniciada', -405], ['aviso_plantio_enviado', -228], ['plantio_planejado', -215], ['plantio_concluido', -200], ['relatorio_plantio_entregue', -178], ['crp_emitido', -157]],
  },
  {
    id: 'p13', clienteId: 'lumen-pompeia', empreendimento: 'Lumen Pompeia', endereco: 'Rua Clélia, 1.020 · Pompeia',
    responsavel: 'Rafael Moura', servico: 'licenciamento', numeroSei: '6027.2019/0004471-2', numeroSimproc: '2016-0.084.512-3', faseAtual: 3, valor: 70_000,
    linhas: [['aceite_proposta', -1180], ['autuacao', -1170], ['guia_emitida', -1150], ['guia_paga', -1130], ['vistoria_realizada', -1050], ['laa_emitido', -980], ['comunique_se', -400], ['resposta_protocolada', -372]],
  },
  {
    id: 'p14', clienteId: 'condominio-bosque-real', empreendimento: 'Condomínio Residencial Bosque Real', endereco: 'Rua Afonso Bovero, 300 · Sumaré',
    responsavel: 'Juliana Prado', servico: 'manejo', numeroSei: '6027.2026/0019153-0', faseAtual: 1, valor: 18_000,
    linhas: [['aceite_proposta', -21], ['autuacao', -12]],
  },
]

const PARCELAS = {
  licenciamento: [
    { descricao: 'Parcela 1/3 · aceite da proposta', fracao: 0.3, gatilho: 'aceite_proposta' },
    { descricao: 'Parcela 2/3 · emissão do LAA', fracao: 0.3, gatilho: 'laa_emitido' },
    { descricao: 'Parcela 3/3 · publicação do TCA', fracao: 0.4, gatilho: 'tca_publicado' },
  ],
  manejo: [
    { descricao: 'Entrada (50%)', fracao: 0.5, gatilho: 'aceite_proposta' },
    { descricao: 'Término do corte (50%)', fracao: 0.5, gatilho: 'corte_concluido' },
  ],
} as const

export function gerarProcessos(hoje: DataISO) {
  const processos: Processo[] = []
  const contratos: Contrato[] = []

  for (const { valor, linhas, ...processo } of CASOS) {
    const eventos: Evento[] = linhas.map(([tipo, dias, diasNoAto], i) => ({
      id: `${processo.id}-e${i + 1}`,
      tipo,
      data: somarDias(hoje, dias),
      origem: DO_DIARIO.has(tipo) ? 'diario' : 'manual',
      diasNoAto,
    }))
    processos.push({ ...processo, eventos })
    contratos.push({
      id: `ct-${processo.id}`,
      processoId: processo.id,
      parcelas: PARCELAS[processo.servico].map((parcela, i) => ({
        id: `${processo.id}-pc${i + 1}`,
        contratoId: `ct-${processo.id}`,
        descricao: parcela.descricao,
        valor: reais(valor * parcela.fracao),
        gatilho: parcela.gatilho,
      })),
    })
  }

  return { processos, contratos }
}

import { somarDias, type DataISO } from '@/lib/datas'
import { diaUtilAnterior, ehDiaUtil } from '@/domain/feriados'
import { ORGAO_SVMA, type Ato } from '@/domain/publicacoes'
import { criarAleatorio } from './aleatorio'
import { CLIENTES } from './clientes'

export type StatusPublicacao = 'nova' | 'confirmada' | 'descartada'

/** A edição mais recente lida pelo robô. `processadaEm` é ISO; `erro` aparece quando o download falhou ou não houve edição. */
export type EdicaoDiario = { data: DataISO; totalAtos: number; atosSvma: number; erro?: string; processadaEm?: string }

const documento = (id: string) => CLIENTES.find((c) => c.id === id)!.documento

/** Atos fictícios no formato real do DOC-SP (texto em caixa alta, como a SVMA publica). */
export function gerarAtos(hoje: DataISO) {
  const edicao = ehDiaUtil(hoje) ? hoje : diaUtilAnterior(hoje)
  const a = criarAleatorio(Number(edicao.replaceAll('-', '')))
  const ato = (id: string, data: DataISO, unidade: string, serie: string, processo: string, texto: string): Ato => ({
    id, data, orgao: ORGAO_SVMA, unidade, serie, processo, documento: String(a.inteiro(167_000_000, 168_999_999)), texto,
  })

  const atos: (Ato & { status: StatusPublicacao; motivo?: string })[] = [
    {
      ...ato('a1', edicao, 'Coordenação de Licenciamento Ambiental', 'Comunique-se', '6027.2026/0000021-3',
        'COMUNIQUE-SE. NÚMERO DO PROCESSO: 2016-0.084.512-3. INTERESSADO: LUMEN POMPEIA SPE LTDA. ASSUNTO: MANEJO ARBÓREO E COMPENSAÇÃO AMBIENTAL. Fica o interessado convocado a apresentar, no prazo de 30 (trinta) dias contados da publicação, a planta de compensação revisada e a anuência do condomínio vizinho, sob pena de indeferimento.'),
      status: 'nova',
    },
    {
      ...ato('a2', edicao, 'Termo de Compromisso Ambiental', 'Extrato do TCA', '6027.2024/0026631-4',
        `EXTRATO DO TERMO DE COMPROMISSO AMBIENTAL – TCA Nº 318/2026. Compromissária: JEQUITIBÁ CAMPO BELO DESENVOLVIMENTO IMOBILIÁRIO SPE LTDA, CNPJ ${documento('jequitiba-campo-belo')}. Endereço: Rua Vieira de Morais, 880. Cláusula 1ª: compensação ambiental pelo manejo de 34 exemplares arbóreos, mediante o plantio de 112 mudas ou depósito no FEMA. Eficácia a partir da publicação deste extrato.`),
      status: 'nova',
    },
    {
      ...ato('a3', edicao, 'Coordenação de Licenciamento Ambiental', 'Comunique-se', '6027.2026/0021874-6',
        `COMUNIQUE-SE. INTERESSADO: ALTAVISTA BUTANTÃ EMPREENDIMENTO IMOBILIÁRIO SPE LTDA, CNPJ ${documento('altavista-butanta')}. Endereço: Rua Alvarenga, 1.250. Apresentar, no prazo de 60 (sessenta) dias, o levantamento arbóreo assinado por responsável técnico e a ART correspondente.`),
      status: 'nova',
    },
    {
      ...ato('a4', edicao, 'Termo de Compromisso Ambiental', 'Despacho Autorizatório', '6027.2025/0030417-9',
        `DESPACHO AUTORIZATÓRIO. Interessado: HORIZONTE TATUAPÉ INCORPORAÇÃO SPE LTDA, CNPJ ${documento('horizonte-tatuape')}. À vista do Parecer Técnico nº 2.217/2026 e da deliberação da Câmara de Compensação Ambiental, AUTORIZO o manejo de 18 exemplares arbóreos, com compensação convertida em 54 mudas.`),
      status: 'nova',
    },
    {
      ...ato('a5', somarDias(hoje, -6), 'Divisão de Fiscalização Ambiental', 'Notificação', '6027.2026/0000018-7',
        `EDITAL DE NOTIFICAÇÃO. Interessado: SUPERMERCADOS BOM PREÇO LTDA, CNPJ ${documento('bom-preco')}. Lavratura do Auto de Intimação nº 162.815 por poda irregular em calçada na Rua Clélia, 2.300, para receber orientações sobre Termo de Ajustamento de Conduta.`),
      status: 'descartada',
      motivo: 'Fiscalização de outra loja do cliente, fora do contrato',
    },
    {
      ...ato('a6', somarDias(hoje, -20), 'Termo de Compromisso Ambiental', 'Extrato do TCA', '6027.2025/0011842-0',
        `EXTRATO DO TERMO DE COMPROMISSO AMBIENTAL – TCA Nº 231/2026. Compromissária: HORIZONTE MOEMA INCORPORAÇÃO SPE LTDA, CNPJ ${documento('horizonte-moema')}. Endereço: Alameda dos Arapanés, 920. Cláusula 1ª: compensação pelo manejo de 22 exemplares arbóreos. Eficácia a partir da publicação deste extrato.`),
      status: 'confirmada',
    },
    {
      ...ato('a7', somarDias(hoje, -24), 'Coordenação de Licenciamento Ambiental', 'Comunique-se', '6027.2026/0003127-4',
        'COMUNIQUE-SE. INTERESSADO: ALTAVISTA PINHEIROS EMPREENDIMENTO IMOBILIÁRIO SPE LTDA. Apresentar, no prazo de 30 (trinta) dias, o memorial de cálculo da compensação e fotos atualizadas do imóvel.'),
      status: 'confirmada',
    },
    {
      ...ato('a8', somarDias(hoje, -34), 'Coordenação de Licenciamento Ambiental', 'Comunique-se', '6027.2025/0024417-3',
        'COMUNIQUE-SE. INTERESSADO: LUMEN VILA OLÍMPIA SPE LTDA. Apresentar, no prazo de 30 (trinta) dias, a certidão de matrícula atualizada e a declaração de inexistência de área de preservação.'),
      status: 'confirmada',
    },
  ]

  return {
    atos,
    edicao: { data: edicao, totalAtos: a.inteiro(2_550, 2_900), atosSvma: a.inteiro(52, 74) } as EdicaoDiario,
  }
}

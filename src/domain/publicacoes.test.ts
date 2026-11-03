import { describe, expect, it } from 'vitest'
import type { Cliente, Processo } from './processos'
import { ORGAO_SVMA, eventoDoAto, prazoDoAto, vincularAto, type Ato } from './publicacoes'

const clientes: Cliente[] = [{ id: 'c1', nome: 'Aurora SPE', documento: '12.345.678/0001-95' }]
const processos: Processo[] = [
  {
    id: 'p1',
    clienteId: 'c1',
    empreendimento: '',
    endereco: '',
    responsavel: '',
    servico: 'licenciamento',
    numeroSei: '6027.2025/0001234-5',
    numeroSimproc: '2016-0.084.512-3',
    faseAtual: 3,
    eventos: [],
  },
]
const ato = (parcial: Partial<Ato>): Ato => ({
  id: 'a1',
  data: '2026-11-03',
  orgao: ORGAO_SVMA,
  unidade: '',
  serie: 'Comunique-se',
  processo: '6027.2026/0000018-7',
  documento: '1',
  texto: '',
  ...parcial,
})

describe('vincularAto', () => {
  it('acha pelo nº SEI da coluna do diário', () => {
    expect(vincularAto(ato({ processo: '6027.2025/0001234-5' }), processos, clientes)).toMatchObject({ comoAchou: 'sei', processoId: 'p1' })
  })

  it('acha processo antigo pelo nº SIMPROC no texto', () => {
    const texto = 'EDITAL DE NOTIFICAÇÃO NÚMERO DO PROCESSO: 2016-0.084.512-3'
    expect(vincularAto(ato({ texto }), processos, clientes)).toMatchObject({ comoAchou: 'simproc', processoId: 'p1' })
  })

  it('acha só o cliente pelo CNPJ no texto', () => {
    const vinculo = vincularAto(ato({ texto: 'Interessado: Aurora SPE, CNPJ 12.345.678/0001-95' }), processos, clientes)
    expect(vinculo).toEqual({ comoAchou: 'cnpj', clienteId: 'c1' })
  })

  it('ato sem nº de processo não casa com processo sem nº SEI', () => {
    const semSei = { ...processos[0], id: 'p2', numeroSei: '', numeroSimproc: undefined }
    expect(vincularAto(ato({ processo: '' }), [semSei], clientes)).toBeUndefined()
  })

  it('ignora outros órgãos', () => {
    expect(vincularAto(ato({ orgao: 'Secretaria da Fazenda', processo: '6027.2025/0001234-5' }), processos, clientes)).toBeUndefined()
  })
})

describe('eventoDoAto', () => {
  it('usa a série do ato', () => {
    expect(eventoDoAto({ serie: 'Comunique-se', texto: '' })).toBe('comunique_se')
    expect(eventoDoAto({ serie: 'Notificação', texto: '' })).toBeUndefined()
  })

  it('no Extrato, separa TCA, CRP e certificado definitivo pelo texto', () => {
    expect(eventoDoAto({ serie: 'Extrato', texto: 'SEI: 6027.2024/0004727-9 EXTRATO DO TERMO DE COMPROMISSO AMBIENTAL TCA Nº 455 / 2026' })).toBe('tca_publicado')
    expect(eventoDoAto({ serie: 'Extrato', texto: 'CERTIFICADO AMBIENTAL RECEBIMENTO PROVISÓRIO DO TERMO DE COMPROMISSO AMBIENTAL - TCA nº 406/2024' })).toBe('crp_emitido')
    expect(eventoDoAto({ serie: 'Extrato', texto: 'CERTIFICADO AMBIENTAL RECEBIMENTO DEFINITIVO DO TERMO DE COMPROMISSO AMBIENTAL - TCA nº 167/2019' })).toBe('certificado_definitivo')
  })

  it('extrato de aditivo ou de contrato não vira evento', () => {
    expect(eventoDoAto({ serie: 'Extrato do Termo Aditivo', texto: 'EXTRATO DO ADITIVO 01 - TERMO DE COMPROMISSO AMBIENTAL TCA Nº 096 / 2017' })).toBeUndefined()
    expect(eventoDoAto({ serie: 'Extrato', texto: 'EXTRATO DO CONTRATO Nº 12/SVMA/2026' })).toBeUndefined()
  })
})

describe('prazoDoAto', () => {
  const comunique = (texto: string) => ({ serie: 'Comunique-se', texto })

  it('lê o prazo de resposta do Comunique-se', () => {
    expect(prazoDoAto(comunique('atender no prazo de 60 (sessenta) dias contados da publicação'))).toBe(60)
    expect(prazoDoAto(comunique('no prazo de até 30 (trinta) dias contados a partir da data desta publicação'))).toBe(30)
    expect(prazoDoAto(comunique('sem prazo'))).toBeUndefined()
  })

  it('ignora "N dias" que não é o prazo de resposta', () => {
    expect(prazoDoAto(comunique('vistoria realizada há 15 dias; apresentar no prazo de 20 (vinte) dias'))).toBe(20)
    expect(prazoDoAto(comunique('autorização com validade de 180 dias'))).toBeUndefined()
  })

  it('não troca o prazo de cláusula do TCA pelo que aparece no extrato', () => {
    expect(prazoDoAto({ serie: 'Extrato', texto: 'EXTRATO DO TERMO DE COMPROMISSO AMBIENTAL TCA Nº 455/2026, no prazo de 720 dias' })).toBeUndefined()
  })
})

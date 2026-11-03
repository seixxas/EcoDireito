import { describe, expect, it } from 'vitest'
import type { Cliente, Processo } from './processos'
import { ORGAO_SVMA, extrairDiasDoTexto, vincularAto, type Ato } from './publicacoes'

const clientes: Cliente[] = [{ id: 'c1', nome: 'Aurora SPE', cnpj: '12.345.678/0001-95' }]
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

  it('ignora outros órgãos', () => {
    expect(vincularAto(ato({ orgao: 'Secretaria da Fazenda', processo: '6027.2025/0001234-5' }), processos, clientes)).toBeUndefined()
  })
})

describe('extrairDiasDoTexto', () => {
  it('lê o prazo escrito no ato', () => {
    expect(extrairDiasDoTexto('atender no prazo de 60 (sessenta) dias contados da publicação')).toBe(60)
    expect(extrairDiasDoTexto('sem prazo')).toBeUndefined()
  })
})

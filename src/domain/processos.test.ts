import { describe, expect, it } from 'vitest'
import { conclusaoDaFase, etapasDaFase, faseDepoisDoEvento, situacaoDaFase, type Evento, type Processo } from './processos'

const hoje = '2026-11-03'

function processo(faseAtual: Processo['faseAtual'], eventos: Omit<Evento, 'id' | 'origem'>[]): Processo {
  return {
    id: 'p1',
    clienteId: 'c1',
    empreendimento: 'Teste',
    endereco: '',
    responsavel: '',
    servico: 'licenciamento',
    faseAtual,
    eventos: eventos.map((e, i) => ({ ...e, id: `e${i}`, origem: 'manual' })),
  }
}

describe('faseDepoisDoEvento', () => {
  it('a etapa final da fase leva o processo para a seguinte', () => {
    expect(faseDepoisDoEvento(1, { tipo: 'aceite_proposta', data: hoje }, hoje)).toBe(2)
    expect(faseDepoisDoEvento(4, { tipo: 'laa_emitido', data: hoje }, hoje)).toBe(5)
  })

  it('etapa que não é a final deixa o processo na fase', () => {
    expect(faseDepoisDoEvento(2, { tipo: 'documentacao_recebida', data: hoje }, hoje)).toBe(2)
    expect(faseDepoisDoEvento(4, { tipo: 'comunique_se', data: hoje }, hoje)).toBe(4)
  })

  it('etapa de fase mais adiante leva o processo até ela', () => {
    expect(faseDepoisDoEvento(4, { tipo: 'tca_publicado', data: hoje }, hoje)).toBe(5)
  })

  it('não volta de fase com etapa de fase anterior', () => {
    expect(faseDepoisDoEvento(5, { tipo: 'comunique_se', data: hoje }, hoje)).toBe(5)
  })

  it('data planejada não muda a fase', () => {
    expect(faseDepoisDoEvento(5, { tipo: 'corte_planejado', data: '2026-12-01' }, hoje)).toBe(5)
  })

  it('o certificado definitivo encerra o processo na última fase', () => {
    expect(faseDepoisDoEvento(8, { tipo: 'certificado_definitivo', data: hoje }, hoje)).toBe(8)
  })
})

describe('etapas da fase', () => {
  const p = processo(4, [
    { tipo: 'vistoria_realizada', data: '2026-06-01' },
    { tipo: 'comunique_se', data: '2026-07-01' },
    { tipo: 'resposta_protocolada', data: '2026-07-20', observacao: 'Planta revisada' },
    { tipo: 'comunique_se', data: '2026-09-01' },
  ])

  it('lista as etapas da fase com as vezes em que aconteceram', () => {
    const etapas = etapasDaFase(p, 4, hoje)
    expect(etapas.map((e) => e.tipo)).toEqual(['comunique_se', 'resposta_protocolada', 'laa_emitido'])
    expect(etapas[0].feitos.map((e) => e.data)).toEqual(['2026-07-01', '2026-09-01'])
    expect(etapas[1].feitos[0].observacao).toBe('Planta revisada')
    expect(etapas[2].feitos).toEqual([])
  })

  it('separa o que tem data marcada para a frente', () => {
    const [marcada] = etapasDaFase(processo(6, [{ tipo: 'corte_planejado', data: '2026-12-01' }]), 6, hoje)
    expect(marcada.feitos).toEqual([])
    expect(marcada.planejados.map((e) => e.data)).toEqual(['2026-12-01'])
  })

  it('diz se a fase está concluída, é a atual ou ainda não começou', () => {
    expect([3, 4, 5].map((fase) => situacaoDaFase(p, fase as 3 | 4 | 5, hoje))).toEqual(['concluida', 'atual', 'futura'])
    expect(conclusaoDaFase(p, 3, hoje)).toBe('2026-06-01')
    expect(conclusaoDaFase(p, 4, hoje)).toBeUndefined()
  })

  it('a última fase fica concluída com o certificado definitivo', () => {
    const encerrado = processo(8, [{ tipo: 'certificado_definitivo', data: '2026-10-01' }])
    expect(situacaoDaFase(encerrado, 8, hoje)).toBe('concluida')
  })
})

import { describe, expect, it } from 'vitest'
import type { Evento, Processo } from './processos'
import { numerosDoComercial, parcelasDaProposta, situacaoDaProposta } from './propostas'

const hoje = '2026-11-03'

function processo(eventos: Omit<Evento, 'id' | 'origem'>[]): Processo {
  return {
    id: 'p1',
    clienteId: 'c1',
    empreendimento: 'Teste',
    endereco: '',
    responsavel: '',
    servico: 'licenciamento',
    faseAtual: 1,
    eventos: eventos.map((e, i) => ({ ...e, id: `e${i}`, origem: 'manual' })),
  }
}

describe('parcelasDaProposta', () => {
  it('divide o licenciamento em 30/30/40 com os gatilhos do contrato', () => {
    expect(parcelasDaProposta('licenciamento', 9_500_000).map((p) => [p.valor, p.gatilho])).toEqual([
      [2_850_000, 'aceite_proposta'],
      [2_850_000, 'laa_emitido'],
      [3_800_000, 'tca_publicado'],
    ])
  })

  it('a soma sempre bate com o total, mesmo com centavo quebrado', () => {
    const parcelas = parcelasDaProposta('licenciamento', 1_000_001)
    expect(parcelas.reduce((s, p) => s + p.valor, 0)).toBe(1_000_001)
  })
})

describe('situacaoDaProposta', () => {
  it('vai de em elaboração a enviada e aprovada', () => {
    expect(situacaoDaProposta(processo([]), hoje).estado).toBe('elaboracao')
    const enviada = situacaoDaProposta(processo([{ tipo: 'proposta_enviada', data: '2026-10-30' }]), hoje)
    expect([enviada.estado, enviada.diasSemResposta, enviada.pedeRetorno]).toEqual(['enviada', 4, false])
    expect(situacaoDaProposta(processo([{ tipo: 'proposta_enviada', data: '2026-10-01' }, { tipo: 'aceite_proposta', data: '2026-10-10' }]), hoje).estado).toBe(
      'aprovada',
    )
  })

  it('pede retorno depois de 7 dias sem resposta', () => {
    expect(situacaoDaProposta(processo([{ tipo: 'proposta_enviada', data: '2026-10-22' }]), hoje).pedeRetorno).toBe(true)
  })

  it('recusada leva o motivo da observação', () => {
    const recusada = situacaoDaProposta(
      processo([
        { tipo: 'proposta_enviada', data: '2026-09-01' },
        { tipo: 'proposta_recusada', data: '2026-09-20', observacao: 'Preço' },
      ]),
      hoje,
    )
    expect([recusada.estado, recusada.motivo]).toEqual(['recusada', 'Preço'])
  })
})

describe('numerosDoComercial', () => {
  it('soma o que está em aberto e calcula conversão e tempo até aprovar', () => {
    const item = (valor: number, eventos: Omit<Evento, 'id' | 'origem'>[]) => ({ valor, situacao: situacaoDaProposta(processo(eventos), hoje) })
    const numeros = numerosDoComercial(
      [
        item(100, []),
        item(200, [{ tipo: 'proposta_enviada', data: '2026-10-20' }]),
        item(300, [{ tipo: 'proposta_enviada', data: '2026-09-01' }, { tipo: 'aceite_proposta', data: '2026-09-11' }]),
        item(400, [{ tipo: 'proposta_enviada', data: '2026-08-01' }, { tipo: 'proposta_recusada', data: '2026-08-20' }]),
      ],
      hoje,
    )
    expect(numeros).toEqual({ emAberto: 300, quantasEmAberto: 2, conversao: 50, diasAteAprovar: 10, pedemRetorno: 1 })
  })
})

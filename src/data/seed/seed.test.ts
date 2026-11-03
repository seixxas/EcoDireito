import { describe, expect, it } from 'vitest'
import { gerarPrazos, situacaoPrazo } from '@/domain/prazos'
import { vincularAto } from '@/domain/publicacoes'
import { gerarBase } from '.'

const hoje = '2026-11-03'
const base = gerarBase(hoje)

describe('dados fictícios', () => {
  it('são determinísticos', () => {
    expect(gerarBase(hoje).financeiro.notas).toEqual(base.financeiro.notas)
  })

  it('numeram as notas sem repetir', () => {
    const numeros = base.financeiro.notas.map((n) => n.numero)
    expect(new Set(numeros).size).toBe(numeros.length)
  })

  it('mantêm o caixa positivo', () => {
    let saldo = base.financeiro.saldoInicial
    for (const lancamento of base.financeiro.lancamentos) {
      saldo += lancamento.valor
      expect(saldo).toBeGreaterThan(0)
    }
  })

  it('mostram prazos em todas as situações', () => {
    const situacoes = new Set(base.processos.flatMap((p) => gerarPrazos(p).map((prazo) => situacaoPrazo(prazo, hoje).situacao)))
    expect([...situacoes].sort()).toEqual(['cumprido', 'hoje', 'no_prazo', 'proximo', 'vencido'])
  })

  it('vinculam todas as publicações a um cliente', () => {
    for (const ato of base.publicacoes.atos) expect(vincularAto(ato, base.processos, base.clientes)).toBeDefined()
  })
})

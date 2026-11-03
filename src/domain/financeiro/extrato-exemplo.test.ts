import { describe, expect, it } from 'vitest'
import { gerarBase } from '@/data/seed'
import { sugerirParaTodas } from './classificacao'
import { lerExtrato } from './extrato'
import { gerarOfx, linhasDeExemplo } from './extrato-exemplo'

// A base fictícia muda com o dia (e com o seed): o exemplo tem de bater com qualquer uma.
describe.each(['2026-11-03', '2026-11-30', '2026-12-15', '2027-01-04'])('extrato de exemplo em %s', (hoje) => {
  const { clientes, financeiro } = gerarBase(hoje)
  const entrada = { hoje, lancamentosSemExtrato: financeiro.lancamentos, notas: financeiro.notas, clientes }
  const leitura = lerExtrato(gerarOfx(linhasDeExemplo(entrada)))
  if ('erro' in leitura) throw new Error(leitura.erro)

  it('dá duas linhas já lançadas, o recebimento de uma nota e duas a classificar', () => {
    const fila = sugerirParaTodas(leitura.linhas, { ...entrada, regras: [] })
    expect(fila.map(({ sugestao }) => sugestao?.tipo)).toEqual(['lancamento', 'lancamento', 'nota', undefined, undefined])
    expect(fila.map(({ linha }) => linha.descricao).slice(3)).toEqual(['PIX ENVIADO GUILHERME S', 'TARIFA PACOTE DE SERVICOS'])
  })

  it('baixar de novo no mesmo dia não duplica na importação (mesmas chaves)', () => {
    const deNovo = lerExtrato(gerarOfx(linhasDeExemplo(entrada)))
    expect('linhas' in deNovo && deNovo.linhas.map((l) => l.chave)).toEqual(leitura.linhas.map((l) => l.chave))
  })
})

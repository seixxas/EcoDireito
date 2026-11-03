import { describe, expect, it } from 'vitest'
import type { Cliente } from '../processos'
import { notasParaCredito, regraPara, sugerir, sugerirTermo, type Regra } from './classificacao'
import { decodificar, lerExtrato, type Leitura } from './extrato'
import type { Lancamento } from './lancamentos'
import type { NotaFiscal } from './notas'

const linhas = (leitura: Leitura) => {
  if ('erro' in leitura) throw new Error(leitura.erro)
  return leitura.linhas.map(({ data, descricao, valor }) => ({ data, descricao, valor }))
}

const OFX_SGML = `OFXHEADER:100
DATA:OFXSGML
CHARSET:1252

<OFX>
<BANKMSGSRSV1><STMTTRNRS><STMTRS><BANKTRANLIST>
<STMTTRN>
<TRNTYPE>DEBIT
<DTPOSTED>20261015120000[-3:BRT]
<TRNAMT>-1250.00
<FITID>A1
<MEMO>PIX ENVIADO VIVEIRO MATA NATIVA
</STMTTRN>
<STMTTRN>
<TRNTYPE>CREDIT
<DTPOSTED>20261016
<TRNAMT>9450,00
<FITID>A2
<NAME>TORRE ALTA SPE
<MEMO>PIX RECEBIDO
</STMTTRN>
</BANKTRANLIST></STMTRS></STMTTRNRS></BANKMSGSRSV1>
</OFX>`

describe('lerExtrato', () => {
  it('lê OFX em SGML, com ponto ou vírgula no valor', () => {
    expect(linhas(lerExtrato(OFX_SGML))).toEqual([
      { data: '2026-10-15', descricao: 'PIX ENVIADO VIVEIRO MATA NATIVA', valor: -125_000 },
      { data: '2026-10-16', descricao: 'TORRE ALTA SPE · PIX RECEBIDO', valor: 945_000 },
    ])
  })

  it('lê CSV com texto antes do cabeçalho, histórico e descrição separados, e ignora as linhas de saldo', () => {
    const csv = [
      'Extrato Conta Corrente',
      'Período ;01/10/2026 a 31/10/2026',
      'Data Lançamento;Histórico;Descrição;Valor;Saldo',
      '01/10/2026;Saldo do dia;;0,00;10.000,00',
      '02/10/2026;Pix enviado;"Plotagens Paulista; Ltda";-1.234,56;8.765,44',
      '03/10/2026;Pix recebido;Torre Alta;12.000,00;20.765,44',
    ].join('\r\n')
    expect(linhas(lerExtrato(csv))).toEqual([
      { data: '2026-10-02', descricao: 'Pix enviado · Plotagens Paulista; Ltda', valor: -123_456 },
      { data: '2026-10-03', descricao: 'Pix recebido · Torre Alta', valor: 1_200_000 },
    ])
  })

  it('lê CSV com crédito e débito em colunas separadas', () => {
    const csv = 'Data,Descrição,Crédito,Débito\n05/10/26,Tarifa,,"35,90"\n06/10/26,Resgate,"5.000,00",'
    expect(linhas(lerExtrato(csv))).toEqual([
      { data: '2026-10-05', descricao: 'Tarifa', valor: -3_590 },
      { data: '2026-10-06', descricao: 'Resgate', valor: 500_000 },
    ])
  })

  it('lê CSV sem cabeçalho (data; descrição; valor) e o sufixo D/C', () => {
    expect(linhas(lerExtrato('07/10/2026;ALUGUEL OUTUBRO;2.468,00 D\n08/10/2026;REEMBOLSO;100,00 C'))).toEqual([
      { data: '2026-10-07', descricao: 'ALUGUEL OUTUBRO', valor: -246_800 },
      { data: '2026-10-08', descricao: 'REEMBOLSO', valor: 10_000 },
    ])
  })

  it('dá a mesma chave ao reimportar e desempata linhas iguais no mesmo arquivo', () => {
    const csv = 'Data;Descrição;Valor\n09/10/2026;PIX JOSE;-100,00\n09/10/2026;PIX JOSE;-100,00'
    const [a, b] = (lerExtrato(csv) as { linhas: { chave: string }[] }).linhas
    expect(a.chave).not.toBe(b.chave)
    expect((lerExtrato(csv) as { linhas: { chave: string }[] }).linhas[1].chave).toBe(b.chave)
  })

  it('recusa arquivo que não é extrato', () => {
    expect(lerExtrato('qualquer coisa\nsem data')).toHaveProperty('erro')
  })

  it('decodifica Windows-1252', () => {
    expect(decodificar(new Uint8Array([0x48, 0x69, 0x73, 0x74, 0xf3, 0x72, 0x69, 0x63, 0x6f]))).toBe('Histórico')
  })
})

describe('classificação', () => {
  const regras: Regra[] = [
    { id: 'r1', contem: 'viveiro', contaId: 'servicos_terceiros' },
    { id: 'r2', contem: 'Viveiro Mata Nativa', contaId: 'equipamentos' },
    { id: 'r3', contem: 'tarifa', contaId: 'despesas_financeiras' },
  ]

  it('usa a regra mais específica, sem diferenciar maiúscula e acento', () => {
    expect(regraPara('PIX ENVIADO VIVEIRO MATA NATIVA', regras)?.id).toBe('r2')
    expect(regraPara('Viveiro São João', regras)?.id).toBe('r1')
    expect(regraPara('TARÍFA PACOTE', regras)?.id).toBe('r3')
    expect(regraPara('Aluguel', regras)).toBeUndefined()
  })

  it('sugere o termo sem números nem palavras do banco', () => {
    expect(sugerirTermo('PIX ENVIADO 15/10 Viveiro Mata Nativa LTDA 123')).toBe('viveiro mata nativa ltda')
    expect(sugerirTermo('TED 001')).toBe('ted 001')
  })

  const clientes: Cliente[] = [
    { id: 'c1', nome: 'Torre Alta Empreendimentos SPE', documento: '' },
    { id: 'c2', nome: 'Jardins do Morumbi SPE', documento: '' },
  ]
  const nota = (parcial: Partial<NotaFiscal>): NotaFiscal => ({
    id: 'n1',
    numero: 1,
    emissao: '2026-10-01',
    clienteId: 'c2',
    descricao: '',
    valor: 1_000_000,
    iss: 50_000,
    retencao: 55_000,
    previsao: '2026-10-15',
    ...parcial,
  })

  it('acha a nota pelo valor líquido ou bruto: primeiro o cliente citado, depois o líquido exato', () => {
    const notas = [nota({ id: 'n1' }), nota({ id: 'n2', clienteId: 'c1' }), nota({ id: 'n3', retencao: 0, previsao: '2026-10-20' })]
    const credito = { data: '2026-10-16', descricao: 'PIX RECEBIDO TORRE ALTA', valor: 945_000 }
    expect(notasParaCredito(credito, notas, clientes).map((n) => n.id)).toEqual(['n2', 'n1'])
    expect(notasParaCredito({ ...credito, valor: 1_000_000 }, notas, clientes).map((n) => n.id)).toEqual(['n2', 'n3', 'n1'])
    expect(notasParaCredito({ ...credito, descricao: 'PIX', valor: 1_000_000 }, notas, clientes).map((n) => n.id)).toEqual(['n3', 'n1', 'n2'])
  })

  it('ignora nota cancelada, já recebida ou emitida depois do crédito', () => {
    const credito = { data: '2026-10-16', descricao: '', valor: 945_000 }
    const notas = [nota({ cancelada: true }), nota({ recebimento: { data: '2026-10-10', valor: 945_000 } }), nota({ emissao: '2026-10-17' })]
    expect(notasParaCredito(credito, notas, clientes)).toEqual([])
  })

  it('sugere primeiro o lançamento já feito, depois a nota, depois a regra', () => {
    const lancamento: Lancamento = { id: 'l1', data: '2026-10-14', competencia: '2026-10', descricao: 'Viveiro', contaId: 'servicos_terceiros', valor: -125_000 }
    const contexto = { lancamentosSemExtrato: [lancamento], notas: [nota({})], clientes, regras }
    expect(sugerir({ data: '2026-10-15', descricao: 'VIVEIRO', valor: -125_000 }, contexto)).toMatchObject({ tipo: 'lancamento' })
    expect(sugerir({ data: '2026-10-19', descricao: 'VIVEIRO', valor: -125_000 }, contexto)).toMatchObject({ tipo: 'regra', regra: { id: 'r1' } })
    expect(sugerir({ data: '2026-10-16', descricao: 'PIX', valor: 945_000 }, contexto)).toMatchObject({ tipo: 'nota' })
    expect(sugerir({ data: '2026-10-16', descricao: 'PIX', valor: 1 }, contexto)).toBeUndefined()
  })
})

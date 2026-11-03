import { diasEntre, type DataISO } from '@/lib/datas'
import type { Centavos } from '@/lib/dinheiro'
import type { Cliente } from '../processos'
import { normalizar } from './extrato'
import type { Lancamento } from './lancamentos'
import { valorLiquido, type NotaFiscal } from './notas'

/** Linha do extrato de exemplo, antes de virar OFX. `id` vira o FITID. */
export type LinhaDeExemplo = { id: string; data: DataISO; descricao: string; valor: Centavos }

/** Conta fictícia do OFX de exemplo (entra na chave das linhas). */
export const CONTA_DE_EXEMPLO = '99999-0'

/** Como o banco escreve: maiúsculas, sem acento nem pontuação. */
const maiusculas = (texto: string) =>
  normalizar(texto)
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .toUpperCase()

/**
 * Um extrato que sempre bate com a base de hoje, para demonstrar a conciliação:
 * - duas saídas que já foram lançadas à mão → "Já lançado";
 * - um PIX recebido com o valor de uma nota em aberto → "Recebimento da NF";
 * - um PIX enviado e uma tarifa, sem lançamento → "a classificar".
 * Baixar de novo no mesmo dia dá as mesmas linhas (o FITID leva a data), e a importação não duplica.
 */
export function linhasDeExemplo(entrada: { hoje: DataISO; lancamentosSemExtrato: Lancamento[]; notas: NotaFiscal[]; clientes: Cliente[] }): LinhaDeExemplo[] {
  const { hoje, lancamentosSemExtrato, notas, clientes } = entrada
  // Valor que nenhum lançamento já feito tem nesses dias: senão a linha seria sugerida como "já lançado".
  const ocupado = (valor: Centavos, data: DataISO) => lancamentosSemExtrato.some((l) => l.valor === valor && Math.abs(diasEntre(l.data, data)) <= 3)
  const livre = (valor: Centavos, data: DataISO) => {
    while (ocupado(valor, data)) valor -= 1
    return valor
  }

  const jaLancadas = lancamentosSemExtrato
    .filter((l) => l.valor < 0 && !l.notaId && l.data <= hoje)
    .sort((a, b) => b.data.localeCompare(a.data))
    .filter((l, i, todas) => todas.findIndex((outra) => outra.valor === l.valor) === i)
    .slice(0, 2)
    .map((l) => ({ id: `EX${l.id}`, data: l.data, descricao: `PAGAMENTO ${maiusculas(l.descricao)}`, valor: l.valor }))

  // A nota em aberto com valor único (a sugestão não depende do nome) e previsão mais perto de hoje.
  const abertas = notas.filter((n) => !n.cancelada && !n.recebimento && n.emissao <= hoje)
  const nota = abertas
    .filter((n) => abertas.every((outra) => outra === n || (valorLiquido(outra) !== valorLiquido(n) && outra.valor !== valorLiquido(n))))
    .filter((n) => !ocupado(valorLiquido(n), hoje))
    .sort((a, b) => Math.abs(diasEntre(a.previsao, hoje)) - Math.abs(diasEntre(b.previsao, hoje)))[0]
  const cliente = clientes.find((c) => c.id === nota?.clienteId)
  const pix = nota &&
    cliente && { id: `EX${hoje}PIXR`, data: hoje, descricao: `PIX RECEBIDO ${maiusculas(cliente.nome).slice(0, 30)}`, valor: valorLiquido(nota) }

  return [
    ...jaLancadas,
    ...(pix ? [pix] : []),
    { id: `EX${hoje}PIXE`, data: hoje, descricao: 'PIX ENVIADO GUILHERME S', valor: livre(-85_000, hoje) },
    { id: `EX${hoje}TAR`, data: hoje, descricao: 'TARIFA PACOTE DE SERVICOS', valor: livre(-6_490, hoje) },
  ]
}

const dataOfx = (data: DataISO) => data.replaceAll('-', '')
const valorOfx = (valor: Centavos) => (valor / 100).toFixed(2)

/** OFX 1.x (SGML), como os bancos exportam. */
export function gerarOfx(linhas: LinhaDeExemplo[], conta = CONTA_DE_EXEMPLO) {
  const transacoes = linhas.map((linha) =>
    [
      '<STMTTRN>',
      `<TRNTYPE>${linha.valor > 0 ? 'CREDIT' : 'DEBIT'}`,
      `<DTPOSTED>${dataOfx(linha.data)}`,
      `<TRNAMT>${valorOfx(linha.valor)}`,
      `<FITID>${linha.id}`,
      `<MEMO>${linha.descricao}`,
      '</STMTTRN>',
    ].join('\n'),
  )
  return [
    'OFXHEADER:100',
    'DATA:OFXSGML',
    'CHARSET:UTF-8',
    '',
    '<OFX>',
    '<BANKMSGSRSV1><STMTTRNRS><STMTRS>',
    `<BANKACCTFROM><BANKID>0001<ACCTID>${conta}</BANKACCTFROM>`,
    '<BANKTRANLIST>',
    ...transacoes,
    '</BANKTRANLIST></STMTRS></STMTTRNRS></BANKMSGSRSV1>',
    '</OFX>',
    '',
  ].join('\n')
}

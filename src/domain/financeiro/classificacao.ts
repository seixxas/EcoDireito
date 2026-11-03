import { diasEntre, type DataISO } from '@/lib/datas'
import type { Centavos } from '@/lib/dinheiro'
import type { Cliente } from '../processos'
import { normalizar } from './extrato'
import type { Lancamento } from './lancamentos'
import { valorLiquido, type NotaFiscal } from './notas'
import type { ContaId } from './plano-de-contas'

/** "Sempre que a descrição do extrato tiver `contem`, lance na conta tal." */
export type Regra = { id: string; contem: string; contaId: ContaId; processoId?: string }

type Movimento = { data: DataISO; descricao: string; valor: Centavos }

/** O que o sistema propõe para uma linha do extrato, da mais segura para a menos. */
export type Sugestao =
  | { tipo: 'lancamento'; lancamento: Lancamento }
  | { tipo: 'nota'; nota: NotaFiscal }
  | { tipo: 'regra'; regra: Regra }

/** Folga entre a data do extrato e a de um lançamento já feito à mão. */
const DIAS_DE_FOLGA = 3

/** Palavras sem acento, sem maiúscula e sem pontuação ("Mata-Nativa" → mata, nativa). */
export function palavrasDe(texto: string) {
  return normalizar(texto)
    .split(/[^a-z0-9]+/)
    .filter(Boolean)
}

/**
 * A regra vale quando todas as palavras dela aparecem na descrição, em qualquer ordem
 * ("conta luz enel" pega "PAGTO CONTA DE LUZ ENEL"). Com mais de uma, ganha a mais específica (o trecho mais longo).
 */
export function regraPara(descricao: string, regras: Regra[]) {
  const texto = palavrasDe(descricao).join(' ')
  return regras
    .filter((regra) => {
      const palavras = palavrasDe(regra.contem)
      return palavras.length > 0 && palavras.every((palavra) => texto.includes(palavra))
    })
    .sort((a, b) => b.contem.length - a.contem.length)[0]
}

const PALAVRAS_DE_BANCO = /\b(pix|ted|doc|transf\w*|enviad[oa]|recebid[oa]|pagamento|pagto|pgto|boleto|de|da|do|para)\b/g

/** Trecho sugerido para uma regra nova: a descrição sem números nem as palavras do banco ("PIX ENVIADO"). */
export function sugerirTermo(descricao: string) {
  const palavras = normalizar(descricao)
    .replace(/[^a-z\s]/g, ' ')
    .replace(PALAVRAS_DE_BANCO, ' ')
    .split(' ')
    .filter((p) => p.length > 1)
  return palavras.slice(0, 4).join(' ') || normalizar(descricao)
}

/** Aparecem no nome de muitos clientes e não identificam nenhum. */
const PALAVRAS_GENERICAS = new Set([
  'ltda',
  'eireli',
  'empreendimento',
  'empreendimentos',
  'imobiliario',
  'imobiliaria',
  'incorporacao',
  'incorporadora',
  'desenvolvimento',
  'participacoes',
  'condominio',
  'edificio',
  'residencial',
  'comercio',
  'servicos',
  'construtora',
  'engenharia',
  'industria',
])

/** Quantas palavras próprias do nome do cliente aparecem na descrição do extrato. */
function citacoes(descricao: string, nomeDoCliente: string) {
  const texto = palavrasDe(descricao)
  return palavrasDe(nomeDoCliente).filter((p) => p.length >= 4 && !PALAVRAS_GENERICAS.has(p) && texto.includes(p)).length
}

/**
 * Notas a receber que batem com o crédito: valor líquido ou bruto igual.
 * Ordem: mais palavras do nome do cliente na descrição, valor líquido exato, previsão mais perto.
 */
export function notasParaCredito(credito: Movimento, notas: NotaFiscal[], clientes: Cliente[]) {
  const pontos = new Map(clientes.map((c) => [c.id, citacoes(credito.descricao, c.nome)]))
  const liquidoExato = (nota: NotaFiscal) => valorLiquido(nota) === credito.valor
  return notas
    .filter((n) => !n.cancelada && !n.recebimento && n.emissao <= credito.data && (liquidoExato(n) || n.valor === credito.valor))
    .map((nota) => ({ nota, citacoes: pontos.get(nota.clienteId) ?? 0 }))
    .sort(
      (a, b) =>
        b.citacoes - a.citacoes ||
        Number(liquidoExato(b.nota)) - Number(liquidoExato(a.nota)) ||
        Math.abs(diasEntre(a.nota.previsao, credito.data)) - Math.abs(diasEntre(b.nota.previsao, credito.data)),
    )
}

type Contexto = { lancamentosSemExtrato: Lancamento[]; notas: NotaFiscal[]; clientes: Cliente[]; regras: Regra[] }

/**
 * Primeiro procura um lançamento já feito à mão (mesmo valor, até 3 dias de diferença), para não lançar duas vezes.
 * Depois, se for crédito, a nota que ele paga. Por último, as regras.
 */
export function sugerir(linha: Movimento, contexto: Contexto): Sugestao | undefined {
  const lancamento = contexto.lancamentosSemExtrato
    .filter((l) => l.valor === linha.valor && Math.abs(diasEntre(l.data, linha.data)) <= DIAS_DE_FOLGA)
    .sort((a, b) => Math.abs(diasEntre(a.data, linha.data)) - Math.abs(diasEntre(b.data, linha.data)))[0]
  if (lancamento) return { tipo: 'lancamento', lancamento }

  // Com mais de uma nota possível, só sugere se o nome do cliente desempata: na dúvida, quem classifica escolhe.
  const [primeira, segunda] = linha.valor > 0 ? notasParaCredito(linha, contexto.notas, contexto.clientes) : []
  if (primeira && (!segunda || primeira.citacoes > segunda.citacoes)) return { tipo: 'nota', nota: primeira.nota }

  const regra = regraPara(linha.descricao, contexto.regras)
  return regra && { tipo: 'regra', regra }
}

/** Identifica a sugestão que estava na tela, para confirmar exatamente ela. */
export function chaveDaSugestao(sugestao: Sugestao) {
  if (sugestao.tipo === 'lancamento') return `lancamento:${sugestao.lancamento.id}`
  if (sugestao.tipo === 'nota') return `nota:${sugestao.nota.id}`
  return `regra:${sugestao.regra.id}`
}

/** Sugere para a fila inteira, da linha mais antiga para a mais nova, sem usar o mesmo lançamento ou a mesma nota duas vezes. */
export function sugerirParaTodas<T extends Movimento>(linhas: T[], contexto: Contexto) {
  let { lancamentosSemExtrato, notas } = contexto
  return [...linhas]
    .sort((a, b) => a.data.localeCompare(b.data))
    .map((linha) => {
      const sugestao = sugerir(linha, { ...contexto, lancamentosSemExtrato, notas })
      if (sugestao?.tipo === 'lancamento') lancamentosSemExtrato = lancamentosSemExtrato.filter((l) => l !== sugestao.lancamento)
      if (sugestao?.tipo === 'nota') notas = notas.filter((n) => n !== sugestao.nota)
      return { linha, sugestao }
    })
}

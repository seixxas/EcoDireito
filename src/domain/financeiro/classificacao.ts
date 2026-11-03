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

/** Com mais de uma regra, ganha a mais específica (o trecho mais longo). */
export function regraPara(descricao: string, regras: Regra[]) {
  const texto = normalizar(descricao)
  return regras.filter((r) => texto.includes(normalizar(r.contem))).sort((a, b) => b.contem.length - a.contem.length)[0]
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

/**
 * Notas a receber que batem com o crédito: valor líquido ou bruto igual.
 * Ordem: cliente citado na descrição, valor líquido exato, previsão mais perto.
 */
export function notasParaCredito(credito: Movimento, notas: NotaFiscal[], clientes: Cliente[]) {
  const texto = normalizar(credito.descricao)
  const citaCliente = (nota: NotaFiscal) =>
    normalizar(clientes.find((c) => c.id === nota.clienteId)?.nome ?? '')
      .split(' ')
      .some((palavra) => palavra.length >= 4 && texto.includes(palavra))
  const liquidoExato = (nota: NotaFiscal) => valorLiquido(nota) === credito.valor
  return notas
    .filter((n) => !n.cancelada && !n.recebimento && n.emissao <= credito.data && (liquidoExato(n) || n.valor === credito.valor))
    .sort(
      (a, b) =>
        Number(citaCliente(b)) - Number(citaCliente(a)) ||
        Number(liquidoExato(b)) - Number(liquidoExato(a)) ||
        Math.abs(diasEntre(a.previsao, credito.data)) - Math.abs(diasEntre(b.previsao, credito.data)),
    )
}

/**
 * Primeiro procura um lançamento já feito à mão (mesmo valor, até 3 dias de diferença), para não lançar duas vezes.
 * Depois, se for crédito, a nota que ele paga. Por último, as regras.
 */
export function sugerir(
  linha: Movimento,
  contexto: { lancamentosSemExtrato: Lancamento[]; notas: NotaFiscal[]; clientes: Cliente[]; regras: Regra[] },
): Sugestao | undefined {
  const lancamento = contexto.lancamentosSemExtrato
    .filter((l) => l.valor === linha.valor && Math.abs(diasEntre(l.data, linha.data)) <= DIAS_DE_FOLGA)
    .sort((a, b) => Math.abs(diasEntre(a.data, linha.data)) - Math.abs(diasEntre(b.data, linha.data)))[0]
  if (lancamento) return { tipo: 'lancamento', lancamento }

  const nota = linha.valor > 0 ? notasParaCredito(linha, contexto.notas, contexto.clientes)[0] : undefined
  if (nota) return { tipo: 'nota', nota }

  const regra = regraPara(linha.descricao, contexto.regras)
  return regra && { tipo: 'regra', regra }
}

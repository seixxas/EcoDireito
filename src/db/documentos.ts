import type { DataISO } from '@/lib/datas'

/**
 * Formato dos documentos no MongoDB, uma coleção por assunto. `_id` é texto: o mesmo id que as telas usam.
 * Valores em centavos. O banco não confere vínculos entre coleções: quem grava confere (`exigirVinculo`).
 */

export type ClienteDoc = {
  _id: string
  nome: string
  /** CNPJ ou CPF, formatado. */
  documento: string
  grupo?: string | null
  criadoEm: Date
}

export type ProcessoDoc = {
  _id: string
  clienteId: string
  empreendimento: string
  endereco: string
  responsavel: string
  /** 'licenciamento' | 'manejo' */
  servico: string
  /** Vazio até a autuação na SVMA. */
  numeroSei?: string | null
  numeroSimproc?: string | null
  numeroTca?: string | null
  faseAtual: number
  criadoEm: Date
}

/** O texto da proposta (fase 1). `_id` é o id do processo. O preço fica no contrato (parcelas). */
export type PropostaDoc = {
  _id: string
  escopo: string
  validadeDias: number
  criadaEm: DataISO
}

export type EventoDoc = {
  _id: string
  processoId: string
  /** Chave de EVENTOS em src/domain/processos.ts */
  tipo: string
  data: DataISO
  /** 'diario' | 'manual' */
  origem: string
  diasNoAto?: number | null
  observacao?: string | null
  criadoEm: Date
}

export type ContratoDoc = {
  _id: string
  processoId: string
}

export type ParcelaDoc = {
  _id: string
  contratoId: string
  ordem: number
  descricao: string
  valor: number
  /** Tipo de evento do processo que libera a parcela. */
  gatilho: string
}

export type NotaDoc = {
  _id: string
  numero: number
  emissao: DataISO
  clienteId: string
  processoId?: string | null
  parcelaId?: string | null
  descricao: string
  valor: number
  iss: number
  retencao: number
  previsao: DataISO
  recebimentoData?: DataISO | null
  recebimentoValor?: number | null
  cancelada: boolean
  criadoEm: Date
}

export type LancamentoDoc = {
  _id: string
  data: DataISO
  /** 'AAAA-MM' */
  competencia: string
  descricao: string
  /** Id de CONTAS em src/domain/financeiro/plano-de-contas.ts */
  contaId: string
  /** Positivo = entrada, negativo = saída. */
  valor: number
  processoId?: string | null
  notaId?: string | null
  /** Nota livre de quem classifica (ex.: "festa de fim de ano"), para o que a descrição do banco não diz. */
  observacao?: string | null
  criadoEm: Date
}

/** Linha importada do extrato do banco. Sai da fila quando vira lançamento (ou se liga a um que já existia). */
export type ExtratoLinhaDoc = {
  _id: string
  /** A mesma linha em duas importações tem a mesma chave (veja src/domain/financeiro/extrato.ts). */
  chave: string
  data: DataISO
  descricao: string
  /** Positivo = crédito, negativo = débito. */
  valor: number
  arquivo: string
  lancamentoId?: string | null
  /** Fora da fila sem virar lançamento (ex.: transferência entre contas da própria empresa). */
  ignorada: boolean
  importadoEm: Date
}

/** "Descrição do extrato contém `contem` → conta tal." */
export type RegraDoc = {
  _id: string
  /** Gravado já normalizado (minúsculas, sem acento). */
  contem: string
  /** Id de CONTAS em src/domain/financeiro/plano-de-contas.ts */
  contaId: string
  processoId?: string | null
  criadoEm: Date
}

/** Conta bancária: o saldo de abertura e o que estava aplicado no início do histórico. */
export type ContaBancariaDoc = {
  _id: string
  nome: string
  saldoInicial: number
  aplicadoInicial: number
  saldoEm: DataISO
}

/** Atos do Diário Oficial que o robô ligou a um cliente ou processo. Um ato por (data, documento): rodar o robô de novo não duplica. */
export type PublicacaoDoc = {
  _id: string
  data: DataISO
  orgao: string
  unidade: string
  serie: string
  /** Coluna "Processo" do diário (nº SEI). */
  processo: string
  documento: string
  texto: string
  /** Endereço do ato no DOC-SP. */
  link?: string | null
  /** 'nova' | 'confirmada' | 'descartada' */
  status: string
  motivo?: string | null
  /** Evento criado ao confirmar. */
  eventoId?: string | null
  criadoEm: Date
}

/** Uma por edição do Diário lida pelo robô. `_id` é a data da edição. */
export type EdicaoDoc = {
  _id: DataISO
  totalAtos: number
  atosSvma: number
  /** Motivo quando o download ou a leitura falhou (para o alerta de falha). */
  erro?: string | null
  processadaEm: Date
}

/** Coleções do Better Auth: `user`, `session`, `account` e `verification`. Só listo aqui o que o nosso código lê ou grava. */
export type UserDoc = {
  _id: string
  name: string
  email: string
  emailVerified: boolean
  createdAt: Date
  updatedAt: Date
  /** Papel em src/lib/permissoes.ts */
  papel: string
  /** Só para o papel 'cliente': de qual cliente ele vê os processos. */
  clienteId?: string | null
}

export type SessionDoc = {
  _id: string
  userId: string
}

export type AccountDoc = {
  _id: string
  accountId: string
  providerId: string
  userId: string
  password: string
  createdAt: Date
  updatedAt: Date
}

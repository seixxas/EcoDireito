import { MongoClient, type ClientSession, type Collection, type Filter } from 'mongodb'
import type {
  AccountDoc,
  ClienteDoc,
  ContaBancariaDoc,
  ContratoDoc,
  EdicaoDoc,
  EventoDoc,
  ExtratoLinhaDoc,
  LancamentoDoc,
  NotaDoc,
  ParcelaDoc,
  ProcessoDoc,
  PropostaDoc,
  PublicacaoDoc,
  RegraDoc,
  SessionDoc,
  UserDoc,
} from './documentos'

/** Sem MONGODB_URI o app usa os dados fictícios em memória (veja src/data/base.ts). */
export const temBanco = Boolean(process.env.MONGODB_URI)

// Sem banco não há login (veja src/data/sessao.ts): o site publicado abriria para qualquer um. Melhor a publicação falhar.
if (!temBanco && process.env.VERCEL_ENV === 'production') throw new Error('Defina MONGODB_URI na Vercel.')

/** Uma conexão por processo: o `globalThis` evita abrir outra a cada recarga do `next dev`. */
const guardado = globalThis as typeof globalThis & { conexaoMongo?: MongoClient }

export const cliente = (guardado.conexaoMongo ??= new MongoClient(process.env.MONGODB_URI ?? 'mongodb://sem-banco.invalid', {
  // Campo `undefined` não vai para o banco, em vez de virar null.
  ignoreUndefined: true,
  maxPoolSize: 10,
  maxIdleTimeMS: 60_000,
  serverSelectionTimeoutMS: 5_000,
}))

export const banco = cliente.db('eco-direito')

export const db = {
  clientes: banco.collection<ClienteDoc>('clientes'),
  processos: banco.collection<ProcessoDoc>('processos'),
  propostas: banco.collection<PropostaDoc>('propostas'),
  eventos: banco.collection<EventoDoc>('eventos'),
  contratos: banco.collection<ContratoDoc>('contratos'),
  parcelas: banco.collection<ParcelaDoc>('parcelas'),
  notasFiscais: banco.collection<NotaDoc>('notas_fiscais'),
  lancamentos: banco.collection<LancamentoDoc>('lancamentos'),
  extratoLinhas: banco.collection<ExtratoLinhaDoc>('extrato_linhas'),
  regrasClassificacao: banco.collection<RegraDoc>('regras_classificacao'),
  contasBancarias: banco.collection<ContaBancariaDoc>('contas_bancarias'),
  publicacoes: banco.collection<PublicacaoDoc>('publicacoes'),
  edicoesDiario: banco.collection<EdicaoDoc>('edicoes_diario'),
  user: banco.collection<UserDoc>('user'),
  session: banco.collection<SessionDoc>('session'),
  account: banco.collection<AccountDoc>('account'),
}

/** Chame no começo de toda função que grava. */
export function exigirBanco() {
  if (!temBanco) throw new Error('Banco não configurado: crie o .env.local com a MONGODB_URI.')
}

/**
 * Gravações que entram todas ou nenhuma: um erro aqui dentro desfaz o que já foi feito.
 * O banco pode pedir para rodar a função de novo (dois cliques ao mesmo tempo), então ela não pode guardar nada fora daqui.
 */
export function emTransacao<T>(gravar: (session: ClientSession) => Promise<T>) {
  return cliente.withSession((session) => session.withTransaction(() => gravar(session)))
}

/** O banco não confere vínculos: sem isto, um id inexistente vindo de um formulário derrubaria as telas que buscam, por exemplo, o cliente do processo. */
export async function exigirVinculo<T extends { _id: string }>(colecao: Collection<T>, id: string | null | undefined) {
  if (!id) return
  const achou = await colecao.countDocuments({ _id: id } as Filter<T>, { limit: 1 })
  if (!achou) throw new Error(`Vínculo inexistente em ${colecao.collectionName}: ${id}`)
}

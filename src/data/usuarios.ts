import { randomUUID } from 'node:crypto'
import { hashPassword } from 'better-auth/crypto'
import { MongoServerError } from 'mongodb'
import { db, emTransacao, exigirBanco, exigirVinculo, temBanco } from '@/db'
import { ehPapel, type Papel } from '@/lib/permissoes'
import { exigirArea } from './sessao'
import { guardarNaTela } from './telas'

/** Código do MongoDB para índice único violado. */
const CHAVE_DUPLICADA = 11000

export async function listarUsuarios() {
  'use cache: private'
  guardarNaTela()
  await exigirArea('usuarios')
  if (!temBanco) return []
  const [usuarios, clientes] = await Promise.all([
    db.user.find({}, { sort: { name: 1 }, collation: { locale: 'pt' } }).toArray(),
    db.clientes.find({}, { projection: { nome: 1 } }).toArray(),
  ])
  return usuarios.map((usuario) => ({
    id: usuario._id,
    nome: usuario.name,
    email: usuario.email,
    papel: (ehPapel(usuario.papel) ? usuario.papel : 'equipe') as Papel,
    cliente: clientes.find((c) => c._id === usuario.clienteId)?.nome ?? null,
  }))
}

const EMAIL_EM_USO = { erro: 'Já existe um usuário com esse e-mail.' }

/** Cria o login com senha (sem e-mail de convite por enquanto). O e-mail fica em minúsculas, como o login procura. */
export async function criarUsuario(dados: { nome: string; email: string; papel: Papel; clienteId?: string; senha: string }): Promise<{ erro?: string }> {
  exigirBanco()
  const email = dados.email.trim().toLowerCase()
  if (await db.user.countDocuments({ email }, { limit: 1 })) return EMAIL_EM_USO
  await exigirVinculo(db.clientes, dados.clienteId)

  const id = randomUUID()
  const password = await hashPassword(dados.senha)
  const agora = new Date()
  try {
    // Usuário e senha juntos: sem a conta de senha, o usuário ficaria sem conseguir entrar.
    await emTransacao(async (session) => {
      await db.user.insertOne({ _id: id, name: dados.nome, email, emailVerified: true, papel: dados.papel, clienteId: dados.clienteId, createdAt: agora, updatedAt: agora }, { session })
      await db.account.insertOne({ _id: randomUUID(), accountId: id, providerId: 'credential', userId: id, password, createdAt: agora, updatedAt: agora }, { session })
    })
  } catch (erro) {
    // Dois cadastros ao mesmo tempo com o mesmo e-mail: o índice único do banco segura o segundo.
    if (erro instanceof MongoServerError && erro.code === CHAVE_DUPLICADA) return EMAIL_EM_USO
    throw erro
  }
  return {}
}

export async function removerUsuario(id: string) {
  exigirBanco()
  await emTransacao(async (session) => {
    await db.session.deleteMany({ userId: id }, { session })
    await db.account.deleteMany({ userId: id }, { session })
    await db.user.deleteOne({ _id: id }, { session })
  })
}

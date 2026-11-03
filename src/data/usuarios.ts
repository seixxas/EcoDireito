import { randomUUID } from 'node:crypto'
import { hashPassword } from 'better-auth/crypto'
import { asc, eq } from 'drizzle-orm'
import { db, exigirBanco, schema, temBanco } from '@/db'
import { ehPapel, type Papel } from '@/lib/permissoes'
import { exigirArea } from './sessao'

export async function listarUsuarios() {
  await exigirArea('usuarios')
  if (!temBanco) return []
  const linhas = await db
    .select({ id: schema.user.id, nome: schema.user.name, email: schema.user.email, papel: schema.user.papel, cliente: schema.clientes.nome })
    .from(schema.user)
    .leftJoin(schema.clientes, eq(schema.user.clienteId, schema.clientes.id))
    .orderBy(asc(schema.user.name))
  return linhas.map((linha) => ({ ...linha, papel: (ehPapel(linha.papel) ? linha.papel : 'equipe') as Papel }))
}

const EMAIL_EM_USO = { erro: 'Já existe um usuário com esse e-mail.' }

/** Cria o login com senha (sem e-mail de convite por enquanto). O e-mail fica em minúsculas, como o login procura. */
export async function criarUsuario(dados: { nome: string; email: string; papel: Papel; clienteId?: string; senha: string }): Promise<{ erro?: string }> {
  exigirBanco()
  const email = dados.email.trim().toLowerCase()
  const [existente] = await db.select({ id: schema.user.id }).from(schema.user).where(eq(schema.user.email, email))
  if (existente) return EMAIL_EM_USO

  const id = randomUUID()
  try {
    // Usuário e senha juntos: sem a conta de senha, o usuário ficaria sem conseguir entrar.
    await db.batch([
      db.insert(schema.user).values({ id, name: dados.nome, email, emailVerified: true, papel: dados.papel, clienteId: dados.clienteId }),
      db.insert(schema.account).values({ id: randomUUID(), accountId: id, providerId: 'credential', userId: id, password: await hashPassword(dados.senha) }),
    ])
  } catch (erro) {
    // Dois cadastros ao mesmo tempo com o mesmo e-mail: o índice único do banco segura o segundo.
    if (String(erro).includes('user_email_unique')) return EMAIL_EM_USO
    throw erro
  }
  return {}
}

export async function removerUsuario(id: string) {
  exigirBanco()
  await db.delete(schema.user).where(eq(schema.user.id, id))
}

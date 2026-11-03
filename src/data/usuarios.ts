import { randomUUID } from 'node:crypto'
import { hashPassword } from 'better-auth/crypto'
import { asc, eq } from 'drizzle-orm'
import { db, exigirBanco, schema, temBanco } from '@/db'
import { ehPapel, type Papel } from '@/lib/permissoes'

export async function listarUsuarios() {
  if (!temBanco) return []
  const linhas = await db
    .select({ id: schema.user.id, nome: schema.user.name, email: schema.user.email, papel: schema.user.papel, cliente: schema.clientes.nome })
    .from(schema.user)
    .leftJoin(schema.clientes, eq(schema.user.clienteId, schema.clientes.id))
    .orderBy(asc(schema.user.name))
  return linhas.map((linha) => ({ ...linha, papel: (ehPapel(linha.papel) ? linha.papel : 'equipe') as Papel }))
}

/** Cria o login com senha (sem e-mail de convite por enquanto). */
export async function criarUsuario(dados: { nome: string; email: string; papel: Papel; clienteId?: string; senha: string }) {
  exigirBanco()
  const [existente] = await db.select({ id: schema.user.id }).from(schema.user).where(eq(schema.user.email, dados.email))
  if (existente) return { erro: 'Já existe um usuário com esse e-mail.' }
  const id = randomUUID()
  await db.insert(schema.user).values({ id, name: dados.nome, email: dados.email, emailVerified: true, papel: dados.papel, clienteId: dados.clienteId })
  await db.insert(schema.account).values({ id: randomUUID(), accountId: id, providerId: 'credential', userId: id, password: await hashPassword(dados.senha) })
  return {}
}

export async function removerUsuario(id: string) {
  exigirBanco()
  await db.delete(schema.user).where(eq(schema.user.id, id))
}

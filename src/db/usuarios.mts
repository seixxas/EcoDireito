/**
 * Recria os usuários de demonstração, um por perfil. Roda junto com o seed (npm run db:seed).
 * A senha vem de SENHA_DEMO no .env.local.
 */
import { randomUUID } from 'node:crypto'
import { hashPassword } from 'better-auth/crypto'
import { inArray } from 'drizzle-orm'
import type { Papel } from '@/lib/permissoes'
import { db, schema } from '.'

const senha = process.env.SENHA_DEMO
if (!senha) throw new Error('Defina SENHA_DEMO no .env.local')

const USUARIOS: { nome: string; email: string; papel: Papel; clienteId?: string }[] = [
  { nome: 'Admin', email: 'admin@demo.ecodireito.com.br', papel: 'socia' },
  { nome: 'Elaine', email: 'elaine@demo.ecodireito.com.br', papel: 'socia' },
  { nome: 'Karim', email: 'karim@demo.ecodireito.com.br', papel: 'socia' },
  { nome: 'Cissa', email: 'cissa@demo.ecodireito.com.br', papel: 'socia' },
  { nome: 'Juliana Prado', email: 'juliana@demo.ecodireito.com.br', papel: 'equipe' },
  { nome: 'Alexandre', email: 'contador@demo.ecodireito.com.br', papel: 'contador' },
  { nome: 'Altavista Pinheiros', email: 'cliente@demo.ecodireito.com.br', papel: 'cliente', clienteId: 'altavista-pinheiros' },
]

await db.delete(schema.user).where(
  inArray(
    schema.user.email,
    USUARIOS.map((u) => u.email),
  ),
)
const hash = await hashPassword(senha)
for (const usuario of USUARIOS) {
  const id = randomUUID()
  await db.insert(schema.user).values({ id, name: usuario.nome, email: usuario.email, emailVerified: true, papel: usuario.papel, clienteId: usuario.clienteId })
  await db.insert(schema.account).values({ id: randomUUID(), accountId: id, providerId: 'credential', userId: id, password: hash })
}

console.log(`Usuários de demonstração: ${USUARIOS.map((u) => `${u.email} (${u.papel})`).join(', ')}`)

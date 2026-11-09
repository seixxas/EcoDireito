/**
 * Recria os usuários de demonstração, um por perfil. Roda junto com o seed (npm run db:seed).
 * A senha vem de SENHA_DEMO no .env.local.
 */
import { randomUUID } from 'node:crypto'
import { hashPassword } from 'better-auth/crypto'
import type { Papel } from '@/lib/permissoes'
import { cliente, db } from '.'

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

const antigos = await db.user.find({ email: { $in: USUARIOS.map((u) => u.email) } }, { projection: { _id: 1 } }).toArray()
const ids = antigos.map((u) => u._id)
await db.session.deleteMany({ userId: { $in: ids } })
await db.account.deleteMany({ userId: { $in: ids } })
await db.user.deleteMany({ _id: { $in: ids } })

const hash = await hashPassword(senha)
const agora = new Date()
for (const usuario of USUARIOS) {
  const id = randomUUID()
  await db.user.insertOne({ _id: id, name: usuario.nome, email: usuario.email, emailVerified: true, papel: usuario.papel, clienteId: usuario.clienteId, createdAt: agora, updatedAt: agora })
  await db.account.insertOne({ _id: randomUUID(), accountId: id, providerId: 'credential', userId: id, password: hash, createdAt: agora, updatedAt: agora })
}

await cliente.close()
console.log(`Usuários de demonstração: ${USUARIOS.map((u) => `${u.email} (${u.papel})`).join(', ')}`)

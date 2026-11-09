import { betterAuth } from 'better-auth'
import { mongodbAdapter } from 'better-auth/adapters/mongodb'
import { nextCookies } from 'better-auth/next-js'
import { banco, cliente } from '@/db'

/** Login por e-mail e senha. Contas são criadas pela equipe (sem cadastro aberto). */
export const auth = betterAuth({
  database: mongodbAdapter(banco, { client: cliente }),
  // Id em texto, como no resto do banco. Sem isto o adaptador usa ObjectId, e os ids dos usuários viram outro tipo.
  advanced: { database: { generateId: () => crypto.randomUUID() } },
  emailAndPassword: { enabled: true, disableSignUp: true },
  session: { expiresIn: 60 * 60 * 24 * 30 },
  user: {
    additionalFields: {
      papel: { type: 'string', required: true, defaultValue: 'equipe', input: false },
      clienteId: { type: 'string', required: false, input: false },
    },
  },
  plugins: [nextCookies()],
})


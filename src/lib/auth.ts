import { drizzleAdapter } from '@better-auth/drizzle-adapter'
import { betterAuth } from 'better-auth'
import { nextCookies } from 'better-auth/next-js'
import { db, schema } from '@/db'

/** Login por e-mail e senha. Contas são criadas pela equipe (sem cadastro aberto). */
export const auth = betterAuth({
  database: drizzleAdapter(db, { provider: 'pg', schema }),
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

export type Sessao = typeof auth.$Infer.Session

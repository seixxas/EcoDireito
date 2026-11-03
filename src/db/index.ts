import { neon } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-http'
import * as schema from './schema'

/** Sem DATABASE_URL o app usa os dados fictícios em memória (veja src/data/base.ts). */
export const temBanco = Boolean(process.env.DATABASE_URL)

export const db = drizzle({ client: neon(process.env.DATABASE_URL ?? 'postgresql://sem-banco@localhost/sem-banco'), schema, casing: 'snake_case' })

export { schema }

/** Chame no começo de toda função que grava. */
export function exigirBanco() {
  if (!temBanco) throw new Error('Banco não configurado: crie o .env.local com a DATABASE_URL do Neon.')
}

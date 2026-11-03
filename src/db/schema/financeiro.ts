import { boolean, date, integer, pgTable, text, timestamp } from 'drizzle-orm/pg-core'
import { clientes, processos } from './processos'

/** Valores em centavos. */

export const contratos = pgTable('contratos', {
  id: text().primaryKey(),
  processoId: text()
    .notNull()
    .unique()
    .references(() => processos.id, { onDelete: 'cascade' }),
})

export const parcelas = pgTable('parcelas', {
  id: text().primaryKey(),
  contratoId: text()
    .notNull()
    .references(() => contratos.id, { onDelete: 'cascade' }),
  ordem: integer().notNull(),
  descricao: text().notNull(),
  valor: integer().notNull(),
  /** Tipo de evento do processo que libera a parcela. */
  gatilho: text().notNull(),
})

export const notasFiscais = pgTable('notas_fiscais', {
  id: text().primaryKey(),
  numero: integer().notNull().unique(),
  emissao: date({ mode: 'string' }).notNull(),
  clienteId: text()
    .notNull()
    .references(() => clientes.id),
  processoId: text().references(() => processos.id, { onDelete: 'set null' }),
  parcelaId: text().references(() => parcelas.id, { onDelete: 'set null' }),
  descricao: text().notNull(),
  valor: integer().notNull(),
  iss: integer().notNull(),
  retencao: integer().notNull().default(0),
  previsao: date({ mode: 'string' }).notNull(),
  recebimentoData: date({ mode: 'string' }),
  recebimentoValor: integer(),
  cancelada: boolean().notNull().default(false),
  criadoEm: timestamp({ withTimezone: true }).notNull().defaultNow(),
})

export const lancamentos = pgTable('lancamentos', {
  id: text().primaryKey(),
  data: date({ mode: 'string' }).notNull(),
  /** 'AAAA-MM' */
  competencia: text().notNull(),
  descricao: text().notNull(),
  /** Id de CONTAS em src/domain/financeiro/plano-de-contas.ts */
  contaId: text().notNull(),
  /** Positivo = entrada, negativo = saída. */
  valor: integer().notNull(),
  processoId: text().references(() => processos.id, { onDelete: 'set null' }),
  notaId: text().references(() => notasFiscais.id, { onDelete: 'set null' }),
  criadoEm: timestamp({ withTimezone: true }).notNull().defaultNow(),
})

/** Conta bancária: o saldo de abertura e o que estava aplicado no início do histórico. */
export const contasBancarias = pgTable('contas_bancarias', {
  id: text().primaryKey(),
  nome: text().notNull(),
  saldoInicial: integer().notNull(),
  aplicadoInicial: integer().notNull(),
  saldoEm: date({ mode: 'string' }).notNull(),
})

import { date, integer, pgTable, text, timestamp } from 'drizzle-orm/pg-core'

export const clientes = pgTable('clientes', {
  id: text().primaryKey(),
  nome: text().notNull(),
  /** CNPJ ou CPF, formatado. */
  documento: text().notNull(),
  grupo: text(),
  criadoEm: timestamp({ withTimezone: true }).notNull().defaultNow(),
})

export const processos = pgTable('processos', {
  id: text().primaryKey(),
  clienteId: text()
    .notNull()
    .references(() => clientes.id),
  empreendimento: text().notNull(),
  endereco: text().notNull().default(''),
  responsavel: text().notNull().default(''),
  /** 'licenciamento' | 'manejo' */
  servico: text().notNull(),
  /** Vazio até a autuação na SVMA. */
  numeroSei: text(),
  numeroSimproc: text(),
  numeroTca: text(),
  faseAtual: integer().notNull().default(1),
  criadoEm: timestamp({ withTimezone: true }).notNull().defaultNow(),
})

export const eventos = pgTable('eventos', {
  id: text().primaryKey(),
  processoId: text()
    .notNull()
    .references(() => processos.id, { onDelete: 'cascade' }),
  /** Chave de EVENTOS em src/domain/processos.ts */
  tipo: text().notNull(),
  data: date({ mode: 'string' }).notNull(),
  /** 'diario' | 'manual' */
  origem: text().notNull(),
  diasNoAto: integer(),
  observacao: text(),
  criadoEm: timestamp({ withTimezone: true }).notNull().defaultNow(),
})

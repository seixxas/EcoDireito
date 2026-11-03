import { date, integer, pgTable, text, timestamp } from 'drizzle-orm/pg-core'
import { eventos } from './processos'

/** Atos do Diário Oficial que o robô ligou a um cliente ou processo. */
export const publicacoes = pgTable('publicacoes', {
  id: text().primaryKey(),
  data: date({ mode: 'string' }).notNull(),
  orgao: text().notNull(),
  unidade: text().notNull(),
  serie: text().notNull(),
  /** Coluna "Processo" do diário (nº SEI). */
  processo: text().notNull(),
  documento: text().notNull(),
  texto: text().notNull(),
  /** 'nova' | 'confirmada' | 'descartada' */
  status: text().notNull().default('nova'),
  motivo: text(),
  /** Evento criado ao confirmar. */
  eventoId: text().references(() => eventos.id, { onDelete: 'set null' }),
  criadoEm: timestamp({ withTimezone: true }).notNull().defaultNow(),
})

/** Uma linha por edição do Diário lida pelo robô. */
export const edicoesDiario = pgTable('edicoes_diario', {
  data: date({ mode: 'string' }).primaryKey(),
  totalAtos: integer().notNull(),
  atosSvma: integer().notNull(),
  processadaEm: timestamp({ withTimezone: true }).notNull().defaultNow(),
})

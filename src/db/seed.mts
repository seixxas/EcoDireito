/**
 * Apaga os dados de negócio e grava a base fictícia gerada para hoje (ou DATA_DEMO).
 * Uso: npm run db:seed. Os usuários ficam; o login de cliente volta a apontar para o cliente
 * se ele existir na base nova (clientes cadastrados à mão somem com o seed).
 */
import { eq, isNotNull } from 'drizzle-orm'
import type { PgTable } from 'drizzle-orm/pg-core'
import { gerarBase } from '@/data/seed'
import { hojeEmSaoPaulo } from '@/lib/datas'
import { db, schema } from '.'

async function inserir(tabela: PgTable, linhas: object[]) {
  for (let i = 0; i < linhas.length; i += 200) await db.insert(tabela).values(linhas.slice(i, i + 200) as never)
}

const hoje = process.env.DATA_DEMO ?? hojeEmSaoPaulo()
const base = gerarBase(hoje)
const { financeiro } = base

// Apagar os clientes zera o cliente_id dos logins (on delete set null): guardo antes para refazer.
const vinculos = await db.select({ id: schema.user.id, clienteId: schema.user.clienteId }).from(schema.user).where(isNotNull(schema.user.clienteId))

// Extrato e regras primeiro: as linhas apontam para lançamentos (set null) e voltariam para a fila "a classificar".
for (const tabela of [
  schema.extratoLinhas,
  schema.regrasClassificacao,
  schema.lancamentos,
  schema.notasFiscais,
  schema.parcelas,
  schema.contratos,
  schema.publicacoes,
  schema.eventos,
  schema.processos,
  schema.clientes,
  schema.edicoesDiario,
  schema.contasBancarias,
]) {
  await db.delete(tabela)
}

await inserir(schema.clientes, base.clientes)
const idsDeClientes = new Set(base.clientes.map((c) => c.id))
for (const { id, clienteId } of vinculos) {
  if (clienteId && idsDeClientes.has(clienteId)) await db.update(schema.user).set({ clienteId }).where(eq(schema.user.id, id))
}
// O Drizzle grava só as colunas da tabela; campos a mais (como `eventos`) são ignorados.
await inserir(schema.processos, base.processos)
await inserir(schema.eventos, base.processos.flatMap((p) => p.eventos.map((e) => ({ ...e, processoId: p.id }))))
await inserir(schema.contratos, base.contratos.map(({ id, processoId }) => ({ id, processoId })))
await inserir(schema.parcelas, base.contratos.flatMap((c) => c.parcelas.map((parcela, ordem) => ({ ...parcela, ordem }))))
await inserir(
  schema.notasFiscais,
  financeiro.notas.map(({ recebimento, ...nota }) => ({ ...nota, recebimentoData: recebimento?.data, recebimentoValor: recebimento?.valor })),
)
await inserir(schema.lancamentos, financeiro.lancamentos)
await inserir(schema.publicacoes, base.publicacoes.atos)
await inserir(schema.edicoesDiario, [base.publicacoes.edicao])
const aplicadoInicial = financeiro.aplicado + financeiro.lancamentos.filter((l) => l.contaId === 'aplicacoes').reduce((s, l) => s + l.valor, 0)
await inserir(schema.contasBancarias, [
  { id: 'principal', nome: 'Conta corrente', saldoInicial: financeiro.saldoInicial, aplicadoInicial, saldoEm: financeiro.inicio },
])

console.log(
  `Seed de ${hoje}: ${base.clientes.length} clientes, ${base.processos.length} processos, ${financeiro.notas.length} notas, ${financeiro.lancamentos.length} lançamentos.`,
)

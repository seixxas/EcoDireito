/**
 * Apaga os dados de negócio e grava a base fictícia gerada para hoje (ou DATA_DEMO).
 * Uso: npm run db:seed. Os usuários ficam; o login de cliente perde o vínculo se o cliente
 * não existir na base nova (clientes cadastrados à mão somem com o seed).
 */
import { gerarBase } from '@/data/seed'
import { hojeEmSaoPaulo } from '@/lib/datas'
import { cliente, db } from '.'

const hoje = process.env.DATA_DEMO ?? hojeEmSaoPaulo()
const base = gerarBase(hoje)
const { financeiro } = base
const criadoEm = new Date()

for (const colecao of [
  db.extratoLinhas,
  db.regrasClassificacao,
  db.lancamentos,
  db.notasFiscais,
  db.parcelas,
  db.contratos,
  db.publicacoes,
  db.eventos,
  db.propostas,
  db.processos,
  db.clientes,
  db.edicoesDiario,
  db.contasBancarias,
]) {
  await colecao.deleteMany({})
}

await db.clientes.insertMany(base.clientes.map(({ id, ...c }) => ({ _id: id, ...c, criadoEm })))
await db.user.updateMany({ clienteId: { $nin: [...base.clientes.map((c) => c.id), null] } }, { $set: { clienteId: null } })
await db.processos.insertMany(
  base.processos.map(({ id, clienteId, empreendimento, endereco, responsavel, servico, numeroSei, numeroSimproc, numeroTca, faseAtual }) => ({
    _id: id,
    clienteId,
    empreendimento,
    endereco,
    responsavel,
    servico,
    numeroSei,
    numeroSimproc,
    numeroTca,
    faseAtual,
    criadoEm,
  })),
)
await db.eventos.insertMany(base.processos.flatMap((p) => p.eventos.map(({ id, ...e }) => ({ _id: id, processoId: p.id, ...e, criadoEm }))))
await db.propostas.insertMany(base.propostas.map(({ processoId, ...p }) => ({ _id: processoId, ...p })))
await db.contratos.insertMany(base.contratos.map(({ id, processoId }) => ({ _id: id, processoId })))
await db.parcelas.insertMany(base.contratos.flatMap((c) => c.parcelas.map(({ id, ...parcela }, ordem) => ({ _id: id, ...parcela, ordem }))))
await db.notasFiscais.insertMany(
  financeiro.notas.map(({ id, recebimento, cancelada, ...nota }) => ({
    _id: id,
    ...nota,
    recebimentoData: recebimento?.data,
    recebimentoValor: recebimento?.valor,
    cancelada: cancelada ?? false,
    criadoEm,
  })),
)
await db.lancamentos.insertMany(financeiro.lancamentos.map(({ id, ...l }) => ({ _id: id, ...l, criadoEm })))
await db.publicacoes.insertMany(base.publicacoes.atos.map(({ id, ...a }) => ({ _id: id, ...a, criadoEm })))
const { edicao } = base.publicacoes
await db.edicoesDiario.insertOne({ _id: edicao.data, totalAtos: edicao.totalAtos, atosSvma: edicao.atosSvma, erro: edicao.erro, processadaEm: criadoEm })
const aplicadoInicial = financeiro.aplicado + financeiro.lancamentos.filter((l) => l.contaId === 'aplicacoes').reduce((s, l) => s + l.valor, 0)
await db.contasBancarias.insertOne({ _id: 'principal', nome: 'Conta corrente', saldoInicial: financeiro.saldoInicial, aplicadoInicial, saldoEm: financeiro.inicio })

await cliente.close()
console.log(
  `Seed de ${hoje}: ${base.clientes.length} clientes, ${base.processos.length} processos, ${financeiro.notas.length} notas, ${financeiro.lancamentos.length} lançamentos.`,
)

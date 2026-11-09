/**
 * Cria as coleções e os índices. Pode rodar de novo sem problema. Uso: npm run db:indices (o db:seed já chama).
 * Os únicos seguram duplicidade mesmo com dois cliques ao mesmo tempo; os demais evitam varrer a coleção nas gravações.
 */
import { banco, cliente, db } from '.'

const existentes = new Set((await banco.listCollections({}, { nameOnly: true }).toArray()).map((c) => c.name))
// Transação não pode depender de criar coleção no meio do caminho.
for (const colecao of Object.values(db)) {
  if (!existentes.has(colecao.collectionName)) await banco.createCollection(colecao.collectionName)
}

await Promise.all([
  db.contratos.createIndex({ processoId: 1 }, { unique: true }),
  db.notasFiscais.createIndex({ numero: 1 }, { unique: true }),
  db.notasFiscais.createIndex({ parcelaId: 1 }),
  db.lancamentos.createIndex({ notaId: 1, contaId: 1 }),
  db.extratoLinhas.createIndex({ chave: 1 }, { unique: true }),
  db.extratoLinhas.createIndex({ lancamentoId: 1 }),
  db.regrasClassificacao.createIndex({ contem: 1 }, { unique: true }),
  db.publicacoes.createIndex({ data: 1, documento: 1 }, { unique: true }),
  db.publicacoes.createIndex({ eventoId: 1 }),
  db.parcelas.createIndex({ contratoId: 1, ordem: 1 }),
  db.user.createIndex({ email: 1 }, { unique: true }),
  db.session.createIndex({ token: 1 }, { unique: true }),
  db.session.createIndex({ userId: 1 }),
  db.account.createIndex({ userId: 1 }),
])

await cliente.close()
console.log('Coleções e índices prontos.')

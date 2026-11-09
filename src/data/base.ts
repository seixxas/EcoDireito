import type { CollationOptions, Collection, Document, Sort } from 'mongodb'
import { db, temBanco } from '@/db'
import type { Lancamento } from '@/domain/financeiro/lancamentos'
import type { NotaFiscal } from '@/domain/financeiro/notas'
import type { Contrato } from '@/domain/financeiro/parcelas'
import type { ContaId } from '@/domain/financeiro/plano-de-contas'
import { EVENTOS, type Evento, type NumeroFase, type Processo, type Servico, type TipoEvento } from '@/domain/processos'
import { mesDe, mesesEntre, type DataISO } from '@/lib/datas'
import { somar } from '@/lib/dinheiro'
import { pode } from '@/lib/permissoes'
import { hoje } from './hoje'
import { exigirUsuario, type Usuario } from './sessao'
import { guardarNaTela } from './telas'
import { gerarBase, type Base } from './seed'
import type { StatusPublicacao } from './seed/publicacoes'

let memoria: { dia: DataISO; base: Base } | undefined

/** Sem banco (ex.: testes, worktree sem .env.local), usa os dados fictícios gerados em memória. */
function daMemoria(dia: DataISO) {
  if (memoria?.dia !== dia) memoria = { dia, base: gerarBase(dia) }
  return memoria.base
}

/** A coleção inteira de uma vez: sem o `batchSize`, acima de 101 documentos cada coleção faria mais de uma ida ao banco. */
function ler<T extends Document>(colecao: Collection<T>, sort: Sort, collation?: CollationOptions) {
  return colecao.find({}, { sort, collation, batchSize: 10_000 }).toArray()
}

async function doBanco(dia: DataISO): Promise<Base> {
  const [clientes, processos, eventos, propostas, contratos, parcelas, notas, lancamentos, atos, edicao, contaGravada] = await Promise.all([
    ler(db.clientes, { nome: 1 }, { locale: 'pt' }),
    ler(db.processos, { _id: 1 }),
    ler(db.eventos, { data: 1, _id: 1 }),
    ler(db.propostas, { _id: 1 }),
    ler(db.contratos, { _id: 1 }),
    ler(db.parcelas, { ordem: 1 }),
    ler(db.notasFiscais, { emissao: 1, numero: 1 }),
    ler(db.lancamentos, { data: 1, _id: 1 }),
    ler(db.publicacoes, { data: -1, _id: 1 }),
    db.edicoesDiario.findOne({}, { sort: { _id: -1 } }),
    db.contasBancarias.findOne(),
  ])

  const conta = contaGravada ?? { saldoInicial: 0, aplicadoInicial: 0, saldoEm: `${mesDe(dia)}-01` }
  const lancamentosDominio: Lancamento[] = lancamentos.map((l) => ({
    id: l._id,
    data: l.data,
    competencia: l.competencia,
    descricao: l.descricao,
    contaId: l.contaId as ContaId,
    valor: l.valor,
    processoId: l.processoId ?? undefined,
    notaId: l.notaId ?? undefined,
    observacao: l.observacao ?? undefined,
  }))

  return {
    clientes: clientes.map((c) => ({ id: c._id, nome: c.nome, documento: c.documento, grupo: c.grupo ?? undefined })),
    processos: processos.map(
      (p): Processo => ({
        id: p._id,
        clienteId: p.clienteId,
        empreendimento: p.empreendimento,
        endereco: p.endereco,
        responsavel: p.responsavel,
        servico: p.servico as Servico,
        numeroSei: p.numeroSei ?? undefined,
        numeroSimproc: p.numeroSimproc ?? undefined,
        numeroTca: p.numeroTca ?? undefined,
        faseAtual: p.faseAtual as NumeroFase,
        eventos: eventos
          // Tipo que saiu de EVENTOS (ex.: parecer_conclusivo, que virou laa_emitido) não derruba a tela.
          .filter((e) => e.processoId === p._id && e.tipo in EVENTOS)
          .map(
            (e): Evento => ({
              id: e._id,
              tipo: e.tipo as TipoEvento,
              data: e.data,
              origem: e.origem as Evento['origem'],
              diasNoAto: e.diasNoAto ?? undefined,
              observacao: e.observacao ?? undefined,
            }),
          ),
      }),
    ),
    contratos: contratos.map(
      (c): Contrato => ({
        id: c._id,
        processoId: c.processoId,
        parcelas: parcelas
          .filter((pc) => pc.contratoId === c._id)
          .map((pc) => ({ id: pc._id, contratoId: pc.contratoId, descricao: pc.descricao, valor: pc.valor, gatilho: pc.gatilho as TipoEvento })),
      }),
    ),
    propostas: propostas.map(({ _id, ...proposta }) => ({ processoId: _id, ...proposta })),
    publicacoes: {
      atos: atos.map((a) => ({
        id: a._id,
        data: a.data,
        orgao: a.orgao,
        unidade: a.unidade,
        serie: a.serie,
        processo: a.processo,
        documento: a.documento,
        texto: a.texto,
        status: a.status as StatusPublicacao,
        motivo: a.motivo ?? undefined,
        link: a.link ?? undefined,
      })),
      edicao: edicao
        ? { data: edicao._id, totalAtos: edicao.totalAtos, atosSvma: edicao.atosSvma, erro: edicao.erro ?? undefined, processadaEm: edicao.processadaEm.toISOString() }
        : { data: dia, totalAtos: 0, atosSvma: 0 },
    },
    financeiro: {
      inicio: conta.saldoEm,
      meses: mesesEntre(mesDe(conta.saldoEm), mesDe(dia)),
      notas: notas.map(
        (n): NotaFiscal => ({
          id: n._id,
          numero: n.numero,
          emissao: n.emissao,
          clienteId: n.clienteId,
          processoId: n.processoId ?? undefined,
          parcelaId: n.parcelaId ?? undefined,
          descricao: n.descricao,
          valor: n.valor,
          iss: n.iss,
          retencao: n.retencao,
          previsao: n.previsao,
          recebimento: n.recebimentoData ? { data: n.recebimentoData, valor: n.recebimentoValor ?? 0 } : undefined,
          cancelada: n.cancelada,
        }),
      ),
      lancamentos: lancamentosDominio,
      saldoInicial: conta.saldoInicial,
      aplicado: conta.aplicadoInicial - somar(lancamentosDominio.filter((l) => l.contaId === 'aplicacoes').map((l) => l.valor)),
    },
  }
}

/**
 * Corta o que o perfil não pode ver. Fica aqui, e não só no layout, porque o Next
 * renderiza layout e página em paralelo: a página manda os dados mesmo se o layout redirecionar.
 */
function recortarPorPerfil(base: Base, usuario: Usuario): Base {
  const semFinanceiro = { ...base.financeiro, notas: [], lancamentos: [], saldoInicial: 0, aplicado: 0 }
  const semAtos = { ...base.publicacoes, atos: [] }
  if (usuario.papel === 'cliente') {
    return {
      ...base,
      clientes: base.clientes.filter((c) => c.id === usuario.clienteId),
      processos: base.processos.filter((p) => p.clienteId === usuario.clienteId),
      contratos: [],
      propostas: [],
      publicacoes: semAtos,
      financeiro: semFinanceiro,
    }
  }
  const financeiro = pode(usuario.papel, 'financeiro')
  return {
    ...base,
    contratos: financeiro ? base.contratos : [],
    propostas: pode(usuario.papel, 'comercial') ? base.propostas : [],
    financeiro: financeiro ? base.financeiro : semFinanceiro,
    publicacoes: pode(usuario.papel, 'prazos') ? base.publicacoes : semAtos,
  }
}

/**
 * Toda a base do dia que o usuário pode ver, uma leitura por requisição. As funções de src/data partem daqui.
 * Fica guardada só no navegador de quem pediu (`guardarNaTela`): o servidor sempre lê o banco, e o recorte por perfil vale antes de qualquer coisa sair daqui.
 * Sessão e base em paralelo: sem sessão, `exigirUsuario` redireciona e nada do que foi lido sai.
 */
export async function carregar() {
  'use cache: private'
  guardarNaTela()
  const dia = await hoje()
  const [usuario, base] = await Promise.all([exigirUsuario(), temBanco ? doBanco(dia) : daMemoria(dia)])
  return { hoje: dia, usuario, ...recortarPorPerfil(base, usuario) }
}

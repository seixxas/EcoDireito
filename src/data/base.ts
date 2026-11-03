import { asc, desc } from 'drizzle-orm'
import { cache } from 'react'
import { db, schema, temBanco } from '@/db'
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
import { gerarBase, type Base } from './seed'
import type { StatusPublicacao } from './seed/publicacoes'

let memoria: { dia: DataISO; base: Base } | undefined

/** Sem banco (ex.: testes, worktree sem .env.local), usa os dados fictícios gerados em memória. */
function daMemoria(dia: DataISO) {
  if (memoria?.dia !== dia) memoria = { dia, base: gerarBase(dia) }
  return memoria.base
}

async function doBanco(dia: DataISO): Promise<Base> {
  const [clientes, processos, eventos, contratos, parcelas, notas, lancamentos, atos, edicoes, contas] = await Promise.all([
    db.select().from(schema.clientes).orderBy(asc(schema.clientes.nome)),
    db.select().from(schema.processos).orderBy(asc(schema.processos.id)),
    db.select().from(schema.eventos).orderBy(asc(schema.eventos.data)),
    db.select().from(schema.contratos),
    db.select().from(schema.parcelas).orderBy(asc(schema.parcelas.ordem)),
    db.select().from(schema.notasFiscais).orderBy(asc(schema.notasFiscais.emissao), asc(schema.notasFiscais.numero)),
    db.select().from(schema.lancamentos).orderBy(asc(schema.lancamentos.data)),
    db.select().from(schema.publicacoes).orderBy(desc(schema.publicacoes.data)),
    db.select().from(schema.edicoesDiario).orderBy(desc(schema.edicoesDiario.data)).limit(1),
    db.select().from(schema.contasBancarias).limit(1),
  ])

  const conta = contas[0] ?? { saldoInicial: 0, aplicadoInicial: 0, saldoEm: `${mesDe(dia)}-01` }
  const lancamentosDominio: Lancamento[] = lancamentos.map((l) => ({
    id: l.id,
    data: l.data,
    competencia: l.competencia,
    descricao: l.descricao,
    contaId: l.contaId as ContaId,
    valor: l.valor,
    processoId: l.processoId ?? undefined,
    notaId: l.notaId ?? undefined,
  }))

  return {
    clientes: clientes.map((c) => ({ id: c.id, nome: c.nome, documento: c.documento, grupo: c.grupo ?? undefined })),
    processos: processos.map(
      (p): Processo => ({
        id: p.id,
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
          .filter((e) => e.processoId === p.id && e.tipo in EVENTOS)
          .map(
            (e): Evento => ({
              id: e.id,
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
        id: c.id,
        processoId: c.processoId,
        parcelas: parcelas
          .filter((pc) => pc.contratoId === c.id)
          .map((pc) => ({ id: pc.id, contratoId: pc.contratoId, descricao: pc.descricao, valor: pc.valor, gatilho: pc.gatilho as TipoEvento })),
      }),
    ),
    publicacoes: {
      atos: atos.map((a) => ({ ...a, status: a.status as StatusPublicacao, motivo: a.motivo ?? undefined, link: a.link ?? undefined })),
      edicao: edicoes[0]
        ? { ...edicoes[0], erro: edicoes[0].erro ?? undefined, processadaEm: edicoes[0].processadaEm.toISOString() }
        : { data: dia, totalAtos: 0, atosSvma: 0 },
    },
    financeiro: {
      inicio: conta.saldoEm,
      meses: mesesEntre(mesDe(conta.saldoEm), mesDe(dia)),
      notas: notas.map(
        (n): NotaFiscal => ({
          id: n.id,
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
      publicacoes: semAtos,
      financeiro: semFinanceiro,
    }
  }
  const financeiro = pode(usuario.papel, 'financeiro')
  return {
    ...base,
    contratos: financeiro ? base.contratos : [],
    financeiro: financeiro ? base.financeiro : semFinanceiro,
    publicacoes: pode(usuario.papel, 'prazos') ? base.publicacoes : semAtos,
  }
}

/** Toda a base do dia que o usuário pode ver, uma leitura por requisição. As funções de src/data partem daqui. */
export const carregar = cache(async () => {
  const [dia, usuario] = await Promise.all([hoje(), exigirUsuario()])
  return { hoje: dia, usuario, ...recortarPorPerfil(temBanco ? await doBanco(dia) : daMemoria(dia), usuario) }
})

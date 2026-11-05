import type { Metadata } from 'next'
import { LinkRapido } from '@/components/ui/link-rapido'
import type { ReactNode } from 'react'
import { SituacaoDaNota } from '@/components/financeiro/situacao-nota'
import { Busca } from '@/components/ui/busca'
import { Vazio } from '@/components/ui/expansivel'
import { Linha, Lista } from '@/components/ui/lista'
import { PageHeader } from '@/components/ui/page-header'
import { Secao } from '@/components/ui/secao'
import { buscarTudo } from '@/data/busca'
import { hoje } from '@/data/hoje'
import { situacaoNota } from '@/domain/financeiro/notas'
import { FASES } from '@/domain/processos'
import { brl, contar, formatarData } from '@/lib/formatar'

export const metadata: Metadata = { title: 'Busca' }

const POR_GRUPO = 5

function Grupo({ titulo, total, verTodos, children }: { titulo: string; total: number; verTodos: string; children: ReactNode }) {
  if (total === 0) return null
  return (
    <Secao
      titulo={`${titulo} · ${total}`}
      acao={
        total > POR_GRUPO && (
          <LinkRapido href={verTodos} className="link text-sm">
            Ver todos
          </LinkRapido>
        )
      }
    >
      <Lista>{children}</Lista>
    </Secao>
  )
}

/** Resultado da busca do menu: os primeiros de cada tipo, com o caminho para a lista completa. */
export default async function PaginaBusca({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const q = (await searchParams).q?.trim()
  if (!q) {
    return (
      <>
        <PageHeader titulo="Busca" resumo="Procure por cliente, projeto, nº SEI ou nº da NF." />
        <Busca placeholder="Cliente, projeto, nº SEI ou nº da NF" limpar="/busca" />
      </>
    )
  }

  const [{ clientes, processos, notas }, dia] = await Promise.all([buscarTudo(q), hoje()])
  const total = clientes.length + processos.length + notas.length
  const emTexto = encodeURIComponent(q)

  return (
    <>
      <PageHeader titulo="Busca" resumo={total ? `${contar(total, 'resultado', 'resultados')} para “${q}”.` : `Nada encontrado para “${q}”.`} />
      <Busca valor={q} placeholder="Cliente, projeto, nº SEI ou nº da NF" limpar="/busca" className="mb-6" />
      {total === 0 && <Vazio>Confira a grafia ou procure só pelo começo do nome.</Vazio>}

      <Grupo titulo="Projetos" total={processos.length} verTodos={`/projetos?q=${emTexto}`}>
        {processos.slice(0, POR_GRUPO).map(({ processo, cliente, recusada }) => (
          <Linha key={processo.id} href={`/projetos/${processo.id}`}>
            <span className="min-w-0 flex-1">
              <span className="block truncate font-medium text-ink">{processo.empreendimento}</span>
              <span className="block truncate text-xs text-muted">
                {cliente.nome} · {processo.numeroSei ? `SEI ${processo.numeroSei}` : 'sem nº SEI'}
              </span>
            </span>
            <span className="hidden shrink-0 text-sm text-muted sm:block">{recusada ? 'Proposta recusada' : `Fase ${processo.faseAtual} · ${FASES[processo.faseAtual - 1].nome}`}</span>
          </Linha>
        ))}
      </Grupo>

      <Grupo titulo="Clientes" total={clientes.length} verTodos={`/projetos/clientes?q=${emTexto}`}>
        {clientes.slice(0, POR_GRUPO).map((cliente) => (
          <Linha key={cliente.id} href={`/projetos/clientes/${cliente.id}`}>
            <span className="min-w-0 flex-1">
              <span className="block truncate font-medium text-ink">{cliente.nome}</span>
              <span className="block truncate text-xs text-muted">
                {cliente.documento}
                {cliente.grupo && ` · ${cliente.grupo}`}
              </span>
            </span>
          </Linha>
        ))}
      </Grupo>

      <Grupo titulo="Notas" total={notas.length} verTodos={`/financeiro?aba=todas&mes=todos&q=${emTexto}`}>
        {notas.slice(0, POR_GRUPO).map(({ nota, cliente }) => (
          <Linha key={nota.id} href={`/financeiro/notas/${nota.id}`}>
            <span className="w-16 shrink-0 tabular-nums text-muted">NF {nota.numero}</span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-ink">{cliente.nome}</span>
              <span className="block truncate text-xs text-muted">
                {nota.descricao} · {formatarData(nota.emissao)}
              </span>
            </span>
            <span className="hidden shrink-0 tabular-nums text-ink sm:block">{brl(nota.valor)}</span>
            <span className="hidden w-32 shrink-0 md:block">
              <SituacaoDaNota situacao={situacaoNota(nota, dia)} />
            </span>
          </Linha>
        ))}
      </Grupo>
    </>
  )
}

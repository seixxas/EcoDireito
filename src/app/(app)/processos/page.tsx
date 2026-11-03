import type { Metadata } from 'next'
import Link from 'next/link'
import { SituacaoPrazo } from '@/components/prazos/situacao-prazo'
import { FaseProgresso } from '@/components/processos/fase-progresso'
import { Vazio } from '@/components/ui/expansivel'
import { classeBotao } from '@/components/ui/form'
import { Linha, Lista } from '@/components/ui/lista'
import { PageHeader } from '@/components/ui/page-header'
import { Paginacao } from '@/components/ui/paginacao'
import { hoje } from '@/data/hoje'
import { listarProcessos } from '@/data/processos'
import { exigirArea } from '@/data/sessao'
import { paginar } from '@/lib/paginar'
import { pode } from '@/lib/permissoes'

export const metadata: Metadata = { title: 'Processos' }

export default async function PaginaProcessos({ searchParams }: { searchParams: Promise<{ pagina?: string }> }) {
  const [{ pagina }, dia, itens, usuario] = await Promise.all([searchParams, hoje(), listarProcessos(), exigirArea('prazos')])
  const ordenados = [...itens].sort((a, b) => (a.proximo?.vencimento ?? '9999').localeCompare(b.proximo?.vencimento ?? '9999'))
  const comVencido = itens.filter((i) => i.proximo && i.proximo.vencimento < dia).length
  const paginado = paginar(ordenados, pagina)

  return (
    <>
      <PageHeader
        titulo="Processos"
        resumo={`${itens.length} processos na Secretaria do Verde${comVencido ? `, ${comVencido} com prazo vencido` : ''}. Os que vencem primeiro vêm antes.`}
        acoes={
          <>
            <Link href="/processos/clientes" className={classeBotao('secundario')}>
              Clientes
            </Link>
            {pode(usuario.papel, 'prazos', 'editar') && (
              <Link href="/processos/novo" className={classeBotao()}>
                Novo processo
              </Link>
            )}
          </>
        }
      />
      <Lista>
        {paginado.itens.map(({ processo, cliente, proximo }) => (
          <Linha key={processo.id} href={`/processos/${processo.id}`} className="flex-wrap gap-y-1 sm:flex-nowrap">
            <div className="min-w-0 basis-full sm:basis-auto sm:flex-1">
              <p className="truncate font-medium text-ink">{processo.empreendimento}</p>
              <p className="truncate text-xs text-muted">
                {cliente.nome} · {processo.numeroSei ? `SEI ${processo.numeroSei}` : 'sem nº SEI'}
                {processo.servico === 'manejo' && ' · Manejo'}
              </p>
            </div>
            <div className="hidden w-56 shrink-0 md:block">
              <FaseProgresso fase={processo.faseAtual} />
            </div>
            <div className="min-w-0 basis-full sm:w-64 sm:shrink-0 sm:basis-auto">
              {proximo ? (
                <>
                  <p className="truncate text-sm text-ink">{proximo.regra.titulo}</p>
                  <SituacaoPrazo prazo={proximo} hoje={dia} />
                </>
              ) : (
                <span className="text-sm text-subtle">Nenhum prazo em aberto</span>
              )}
            </div>
            <span className="hidden w-24 shrink-0 truncate text-sm text-muted lg:block">{processo.responsavel}</span>
          </Linha>
        ))}
      </Lista>
      {itens.length === 0 && <Vazio>Nenhum processo cadastrado.</Vazio>}
      <Paginacao {...paginado} href={(n) => (n > 1 ? `/processos?pagina=${n}` : '/processos')} />
    </>
  )
}

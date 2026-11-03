import type { Metadata } from 'next'
import Link from 'next/link'
import { SituacaoPrazo } from '@/components/prazos/situacao-prazo'
import { FaseProgresso } from '@/components/processos/fase-progresso'
import { Busca } from '@/components/ui/busca'
import { Vazio } from '@/components/ui/expansivel'
import { classeBotao } from '@/components/ui/form'
import { Linha, Lista } from '@/components/ui/lista'
import { PageHeader } from '@/components/ui/page-header'
import { Paginacao } from '@/components/ui/paginacao'
import { SegmentedLinks } from '@/components/ui/segmented-links'
import { hoje } from '@/data/hoje'
import { listarProcessos } from '@/data/processos'
import { exigirArea } from '@/data/sessao'
import { FASES, type NumeroFase } from '@/domain/processos'
import { combina } from '@/lib/buscar'
import { contar } from '@/lib/formatar'
import { paginar } from '@/lib/paginar'
import { pode } from '@/lib/permissoes'

export const metadata: Metadata = { title: 'Processos' }

type Filtros = { fase?: NumeroFase; q?: string; pagina?: number }

function endereco({ fase, q, pagina = 1 }: Filtros) {
  const busca = new URLSearchParams()
  if (fase) busca.set('fase', String(fase))
  if (q) busca.set('q', q)
  if (pagina > 1) busca.set('pagina', String(pagina))
  return busca.size ? `/processos?${busca}` : '/processos'
}

export default async function PaginaProcessos({ searchParams }: { searchParams: Promise<{ fase?: string; q?: string; pagina?: string }> }) {
  const [{ fase: pedida, q: buscado, pagina }, dia, itens, usuario] = await Promise.all([searchParams, hoje(), listarProcessos(), exigirArea('prazos')])
  const filtros: Filtros = {
    fase: FASES.find((f) => String(f.numero) === pedida)?.numero,
    q: String(buscado ?? '').trim() || undefined,
  }
  const { fase, q } = filtros

  const ordenados = [...itens].sort((a, b) => (a.proximo?.vencimento ?? '9999').localeCompare(b.proximo?.vencimento ?? '9999'))
  const buscados = ordenados.filter(({ processo: p, cliente: c }) =>
    combina(q, p.empreendimento, p.endereco, p.numeroSei, p.numeroSimproc, p.numeroTca, p.responsavel, c.nome, c.grupo),
  )
  const comVencido = itens.filter((i) => i.proximo && i.proximo.vencimento < dia).length
  const paginado = paginar(fase ? buscados.filter((i) => i.processo.faseAtual === fase) : buscados, pagina)

  return (
    <>
      <PageHeader
        titulo="Processos"
        resumo={`${contar(itens.length, 'processo', 'processos')}${comVencido ? `, ${comVencido} com prazo vencido` : ''}. Os que vencem primeiro vêm antes.`}
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
      <div className="mb-6 space-y-3">
        <Busca
          valor={q}
          placeholder="Empreendimento, cliente ou nº SEI"
          manter={{ fase: fase && String(fase) }}
          limpar={endereco({ ...filtros, q: undefined })}
        />
        <SegmentedLinks
          ativo={fase ? String(fase) : 'todas'}
          opcoes={[
            { valor: 'todas', rotulo: 'Todas', href: endereco({ ...filtros, fase: undefined }), contagem: buscados.length },
            ...FASES.map((f) => ({
              valor: String(f.numero),
              // Só a primeira palavra ("Compromisso"), para as 8 fases caberem numa linha.
              rotulo: f.nome.split(' ')[0],
              href: endereco({ ...filtros, fase: f.numero }),
              contagem: buscados.filter((i) => i.processo.faseAtual === f.numero).length,
            })),
          ]}
        />
      </div>
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
      {paginado.total === 0 && <Vazio>{q || fase ? 'Nenhum processo com esse filtro.' : 'Nenhum processo cadastrado.'}</Vazio>}
      <Paginacao {...paginado} href={(n) => endereco({ ...filtros, pagina: n })} />
    </>
  )
}

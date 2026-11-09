import type { Metadata } from 'next'
import { LinkRapido } from '@/components/ui/link-rapido'
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
import { cn } from '@/lib/cn'
import { contar } from '@/lib/formatar'
import { paginar } from '@/lib/paginar'
import { pode } from '@/lib/permissoes'

export const metadata: Metadata = { title: 'Projetos' }

type Filtros = { fase?: NumeroFase; q?: string; pagina?: number }

/** O nome fica com a sobra. Em lista mais estreita que isso, cada projeto empilha em vez de espremer o nome. */
const COLUNAS = '@[52rem]:grid @[52rem]:grid-cols-[minmax(0,1fr)_11rem_15rem_6.5rem_3.5rem]'

/** Ao passar o mouse, a linha ganha um traço verde à esquerda, como um caule; numa lista corrida, subir a linha a faria pular. */
const CAULE_NO_HOVER = 'group-hover:shadow-[inset_3px_0_0_var(--color-brand-500)]'

function endereco({ fase, q, pagina = 1 }: Filtros) {
  const busca = new URLSearchParams()
  if (fase) busca.set('fase', String(fase))
  if (q) busca.set('q', q)
  if (pagina > 1) busca.set('pagina', String(pagina))
  return busca.size ? `/projetos?${busca}` : '/projetos'
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
        titulo="Projetos"
        resumo={`${contar(itens.length, 'projeto', 'projetos')}${comVencido ? `, ${comVencido} com prazo vencido` : ''}. Os que vencem primeiro vêm antes.`}
        acoes={
          <>
            <LinkRapido href="/projetos/clientes" className={classeBotao('secundario')}>
              Clientes
            </LinkRapido>
            {pode(usuario.papel, 'prazos', 'editar') && (
              <LinkRapido href="/projetos/novo" className={classeBotao('primario')}>
                + Novo projeto
              </LinkRapido>
            )}
          </>
        }
      />
      <div className="mb-3 space-y-2">
        <Busca
          valor={q}
          placeholder="Empreendimento, cliente ou nº SEI"
          manter={{ fase: fase && String(fase) }}
          limpar={endereco({ ...filtros, q: undefined })}
        />
        <SegmentedLinks
          rotulo="Fase"
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
      {paginado.total > 0 ? (
        <Lista className="@container">
          <li aria-hidden className={cn('hidden gap-x-3 px-3 py-1.5 text-xs font-medium text-subtle', COLUNAS)}>
            <span>Projeto</span>
            <span>Fase</span>
            <span>Próximo prazo</span>
            <span>Responsável</span>
          </li>
          {paginado.itens.map(({ processo, cliente, proximo }) => (
            <Linha key={processo.id} href={`/projetos/${processo.id}`} className={cn(COLUNAS, CAULE_NO_HOVER)}>
              <div className="min-w-0 basis-full">
                <p className="font-semibold leading-snug text-ink">{processo.empreendimento}</p>
                <p className="text-xs text-muted">
                  {cliente.nome} · <span className="whitespace-nowrap">{processo.numeroSei ? `SEI ${processo.numeroSei}` : 'Sem nº SEI'}</span>
                  {processo.servico === 'manejo' && ' · Manejo'}
                </p>
              </div>
              <div className="min-w-0 flex-1 basis-52">
                <FaseProgresso fase={processo.faseAtual} />
              </div>
              <div className="min-w-0 flex-1 basis-56">
                {proximo ? (
                  <>
                    <SituacaoPrazo prazo={proximo} hoje={dia} />
                    <p className="text-xs leading-snug text-ink">{proximo.regra.titulo}</p>
                  </>
                ) : (
                  <span className="text-xs text-muted">Nenhum prazo em aberto</span>
                )}
              </div>
              <p className="text-xs text-ink">
                {processo.responsavel && <span className="@[52rem]:hidden">Responsável: </span>}
                {processo.responsavel}
              </p>
            </Linha>
          ))}
        </Lista>
      ) : (
        <Vazio>{q || fase ? 'Nenhum projeto com esse filtro.' : 'Nenhum projeto cadastrado.'}</Vazio>
      )}
      <Paginacao {...paginado} href={(n) => endereco({ ...filtros, pagina: n })} />
    </>
  )
}

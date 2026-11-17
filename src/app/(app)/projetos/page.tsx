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
import { PERIODOS, periodoDoPrazo } from '@/domain/prazos'
import { FASES, type NumeroFase } from '@/domain/processos'
import { combina } from '@/lib/buscar'
import { cn } from '@/lib/cn'
import { contar } from '@/lib/formatar'
import { paginar } from '@/lib/paginar'
import { pode } from '@/lib/permissoes'

export const metadata: Metadata = { title: 'Projetos' }

/** Filtro do próximo prazo: os blocos da tela de Prazos e os projetos sem nenhum prazo correndo. */
const PRAZOS = { ...PERIODOS, sem: 'Sem prazo' } as const
type FiltroPrazo = keyof typeof PRAZOS

type Filtros = { fase?: NumeroFase; responsavel?: string; prazo?: FiltroPrazo; q?: string; pagina?: number }

/** O nome fica com a sobra. Em lista mais estreita que isso, cada projeto empilha em vez de espremer o nome. */
const COLUNAS = '@[52rem]:grid @[52rem]:grid-cols-[minmax(0,1fr)_11rem_15rem_6.5rem_3.5rem]'

/** Ao passar o mouse, a linha ganha um traço verde à esquerda, como um caule; numa lista corrida, subir a linha a faria pular. */
const CAULE_NO_HOVER = 'group-hover:shadow-[inset_3px_0_0_var(--color-brand-500)]'

function endereco({ fase, responsavel, prazo, q, pagina = 1 }: Filtros) {
  const busca = new URLSearchParams()
  if (fase) busca.set('fase', String(fase))
  if (responsavel) busca.set('responsavel', responsavel)
  if (prazo) busca.set('prazo', prazo)
  if (q) busca.set('q', q)
  if (pagina > 1) busca.set('pagina', String(pagina))
  return busca.size ? `/projetos?${busca}` : '/projetos'
}

type Parametros = { fase?: string; responsavel?: string; prazo?: string; q?: string; pagina?: string }

export default async function PaginaProcessos({ searchParams }: { searchParams: Promise<Parametros> }) {
  const [parametros, dia, itens, usuario] = await Promise.all([searchParams, hoje(), listarProcessos(), exigirArea('prazos')])
  const responsaveis = [...new Set(itens.map((i) => i.processo.responsavel).filter(Boolean))].sort()
  const filtros: Filtros = {
    fase: FASES.find((f) => String(f.numero) === parametros.fase)?.numero,
    responsavel: responsaveis.find((r) => r === parametros.responsavel),
    prazo: parametros.prazo && Object.hasOwn(PRAZOS, parametros.prazo) ? (parametros.prazo as FiltroPrazo) : undefined,
    q: String(parametros.q ?? '').trim() || undefined,
  }
  const { fase, responsavel, prazo, q } = filtros
  type Item = (typeof itens)[number]
  const prazoDe = ({ proximo }: Item): FiltroPrazo => (proximo ? periodoDoPrazo(proximo.vencimento, dia) : 'sem')

  const ordenados = [...itens].sort((a, b) => (a.proximo?.vencimento ?? '9999').localeCompare(b.proximo?.vencimento ?? '9999'))
  const buscados = ordenados.filter(({ processo: p, cliente: c }) =>
    combina(q, p.empreendimento, p.endereco, p.numeroSei, p.numeroSimproc, p.numeroTca, p.responsavel, c.nome, c.grupo),
  )
  const comVencido = itens.filter((i) => i.proximo && i.proximo.vencimento < dia).length
  // Cada filtro conta o que sobra com os outros dois ligados.
  const naFase = (i: Item) => !fase || i.processo.faseAtual === fase
  const doResponsavel = (i: Item) => !responsavel || i.processo.responsavel === responsavel
  const noPrazo = (i: Item) => !prazo || prazoDe(i) === prazo
  const paraFase = buscados.filter((i) => doResponsavel(i) && noPrazo(i))
  const paraResponsavel = buscados.filter((i) => naFase(i) && noPrazo(i))
  const paraPrazo = buscados.filter((i) => naFase(i) && doResponsavel(i))
  const paginado = paginar(paraFase.filter(naFase), parametros.pagina)

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
          manter={{ fase: fase && String(fase), responsavel, prazo }}
          limpar={endereco({ ...filtros, q: undefined })}
        />
        <SegmentedLinks
          rotulo="Fase"
          ativo={fase ? String(fase) : 'todas'}
          opcoes={[
            { valor: 'todas', rotulo: 'Todas', href: endereco({ ...filtros, fase: undefined }), contagem: paraFase.length },
            ...FASES.map((f) => ({
              valor: String(f.numero),
              // Só a primeira palavra ("Compromisso"), para as 8 fases caberem numa linha.
              rotulo: f.nome.split(' ')[0],
              href: endereco({ ...filtros, fase: f.numero }),
              contagem: paraFase.filter((i) => i.processo.faseAtual === f.numero).length,
            })),
          ]}
        />
        <div className="flex flex-wrap items-end gap-x-4 gap-y-2">
          {responsaveis.length > 1 && (
            <SegmentedLinks
              rotulo="Responsável"
              ativo={responsavel ?? 'todos'}
              opcoes={[
                { valor: 'todos', rotulo: 'Todos', href: endereco({ ...filtros, responsavel: undefined }), contagem: paraResponsavel.length },
                ...responsaveis.map((r) => ({
                  valor: r,
                  rotulo: r.split(' ')[0],
                  href: endereco({ ...filtros, responsavel: r }),
                  contagem: paraResponsavel.filter((i) => i.processo.responsavel === r).length,
                })),
              ]}
            />
          )}
          <SegmentedLinks
            rotulo="Próximo prazo"
            ativo={prazo ?? 'todos'}
            opcoes={[
              { valor: 'todos', rotulo: 'Todos', href: endereco({ ...filtros, prazo: undefined }), contagem: paraPrazo.length },
              ...(Object.keys(PRAZOS) as FiltroPrazo[]).map((p) => ({
                valor: p,
                rotulo: PRAZOS[p],
                href: endereco({ ...filtros, prazo: p }),
                contagem: paraPrazo.filter((i) => prazoDe(i) === p).length,
              })),
            ]}
          />
        </div>
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
                  {cliente.nome}
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
        <Vazio>{q || fase || responsavel || prazo ? 'Nenhum projeto com esse filtro.' : 'Nenhum projeto cadastrado.'}</Vazio>
      )}
      <Paginacao {...paginado} href={(n) => endereco({ ...filtros, pagina: n })} />
    </>
  )
}

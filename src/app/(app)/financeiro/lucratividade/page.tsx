import type { Metadata } from 'next'
import { LinkRapido } from '@/components/ui/link-rapido'
import { COR_DO_TEXTO } from '@/components/ui/badge'
import { Busca } from '@/components/ui/busca'
import { Card } from '@/components/ui/card'
import { Vazio } from '@/components/ui/expansivel'
import { PageHeader } from '@/components/ui/page-header'
import { Paginacao } from '@/components/ui/paginacao'
import { ItemResumo } from '@/components/ui/resumo'
import { SegmentedLinks } from '@/components/ui/segmented-links'
import { lucratividadePorProjeto } from '@/data/financeiro'
import { exigirArea } from '@/data/sessao'
import { MARGEM_BOA, MARGEM_MINIMA, porMargem, resumoDaLucratividade, type SituacaoMargem } from '@/domain/financeiro/lucratividade'
import { combina } from '@/lib/buscar'
import { cn } from '@/lib/cn'
import { brl, contar, formatarPercentual } from '@/lib/formatar'
import { paginar } from '@/lib/paginar'
import { AbrirLinha } from '../_components/abrir-linha'
import { AvisoDeSimulacao, MARGENS, Margem } from './_components/margem'
import { NoCartao, TABELA_EMPILHADA } from '../_components/tabela-empilhada'

export const metadata: Metadata = { title: 'Lucratividade por projeto' }

type Filtros = { q?: string; margem?: string; pagina?: string }

/** Letra do desenho nesta tabela, mais apertada: são muitas colunas de dinheiro. */
const VALOR = 'num px-2 text-sm font-normal'
const SO_EM_TELA_GRANDE = 'hidden! 2xl:table-cell!'

export default async function PaginaLucratividade({ searchParams }: { searchParams: Promise<Filtros> }) {
  const [filtros, projetos] = await Promise.all([searchParams, lucratividadePorProjeto(), exigirArea('financeiro')])
  const q = filtros.q?.trim() || undefined
  const margem = filtros.margem && filtros.margem in MARGENS ? (filtros.margem as SituacaoMargem) : undefined
  const link = (novos: Filtros) => {
    const f = { q, margem, ...novos }
    const params = new URLSearchParams()
    if (f.q) params.set('q', f.q)
    if (f.margem) params.set('margem', f.margem)
    if (f.pagina && f.pagina !== '1') params.set('pagina', f.pagina)
    return params.size ? `/financeiro/lucratividade?${params}` : '/financeiro/lucratividade'
  }

  const resumo = resumoDaLucratividade(projetos)
  const buscados = projetos.filter(({ processo, cliente }) => combina(q, processo.empreendimento, cliente.nome, cliente.grupo, processo.numeroSei))
  const lista = buscados.filter((p) => !margem || p.situacao === margem).sort(porMargem)
  const paginado = paginar(lista, filtros.pagina)
  const tomDaMedia = resumo.margemPct === undefined ? 'neutral' : resumo.margemPct >= MARGEM_BOA ? 'ok' : resumo.margemPct >= MARGEM_MINIMA ? 'warn' : 'danger'

  return (
    <>
      <PageHeader titulo="Lucratividade por projeto" resumo={`${contar(projetos.length, 'projeto', 'projetos')} com proposta aceita.`} />

      <AvisoDeSimulacao />

      <section aria-label="Resumo" className="mt-3 grid items-center gap-x-6 gap-y-2 rounded-lg bg-painel px-4 py-2 lg:grid-cols-[13rem_minmax(0,1fr)]">
        <div>
          <p className="text-xs text-subtle">Margem média</p>
          <p className={cn('text-xl font-semibold leading-tight', COR_DO_TEXTO[tomDaMedia])}>
            {resumo.margemPct === undefined ? '—' : formatarPercentual(resumo.margemPct)}
          </p>
          <p className="text-xs text-muted">{brl(resumo.margem)} sobre o faturado</p>
        </div>
        <dl className="grid gap-x-6 sm:grid-cols-2">
          <ItemResumo rotulo="Faturado" valor={brl(resumo.receita)} />
          <ItemResumo rotulo="Custo" valor={`− ${brl(resumo.custo)}`} detalhe="diretos + equipe" />
          <ItemResumo rotulo="Mais lucrativo" valor={resumo.melhor ? formatarPercentual(resumo.melhor.margemPct!) : '—'} detalhe={resumo.melhor?.processo.empreendimento} tom="ok" />
          <ItemResumo
            rotulo="Menos lucrativo"
            valor={resumo.pior ? formatarPercentual(resumo.pior.margemPct!) : '—'}
            detalhe={resumo.pior?.processo.empreendimento}
            tom={resumo.pior?.situacao === 'ruim' ? 'danger' : resumo.pior?.situacao === 'atencao' ? 'warn' : 'neutral'}
          />
        </dl>
      </section>

      <div className="mb-2 mt-3 flex flex-wrap items-center justify-between gap-2">
        <SegmentedLinks
          rotulo="Margem"
          ativo={margem ?? 'todas'}
          opcoes={[
            { valor: 'todas', rotulo: 'Todas', href: link({ margem: undefined }), contagem: buscados.length },
            ...Object.entries(MARGENS).map(([valor, { rotulo }]) => ({
              valor,
              rotulo,
              href: link({ margem: valor }),
              contagem: buscados.filter((p) => p.situacao === valor).length,
            })),
          ]}
        />
        <Busca valor={q} placeholder="Projeto, cliente, grupo ou nº SEI" manter={{ margem }} limpar={link({ q: undefined })} className="min-w-60" />
      </div>

      <Card flush>
        <table className={`${TABELA_EMPILHADA} max-[48rem]:[&_td:last-child]:ml-auto`}>
          <thead>
            <tr>
              <th>Projeto</th>
              <th className={cn('num', SO_EM_TELA_GRANDE)}>Contrato</th>
              <th className="num">Faturado</th>
              <th className="num whitespace-normal">Custos diretos</th>
              <th className="num whitespace-normal">Equipe (estimado)</th>
              <th className="num">Margem</th>
              <th className="num">Ação</th>
            </tr>
          </thead>
          <tbody>
            {paginado.itens.map((p) => (
              <tr key={p.processo.id}>
                <td className="min-w-0 min-[48rem]:min-w-52">
                  <LinkRapido href={`/financeiro/lucratividade/${p.processo.id}`} className="link text-ink">
                    {p.processo.empreendimento}
                  </LinkRapido>
                  <p className="text-xs text-muted">
                    {p.cliente.nome}
                    <span className="2xl:hidden"> · Contrato de {brl(p.contratado)}</span>
                  </p>
                </td>
                <td className={cn(VALOR, SO_EM_TELA_GRANDE)}>{brl(p.contratado)}</td>
                <td className={VALOR}>
                  <NoCartao>Faturado</NoCartao>
                  {brl(p.faturado)}
                </td>
                <td className={VALOR}>
                  <NoCartao>Custos diretos</NoCartao>
                  {brl(p.custosDiretos)}
                </td>
                <td className={VALOR}>
                  <NoCartao>Equipe (estimado)</NoCartao>
                  {brl(p.custoEquipe)}
                </td>
                <td className="num px-2">
                  <NoCartao>Margem</NoCartao>
                  <span className="max-sm:text-right">
                    {p.margem !== undefined && <span className="block">{brl(p.margem)}</span>}
                    <Margem margemPct={p.margemPct} situacao={p.situacao} />
                  </span>
                </td>
                <AbrirLinha href={`/financeiro/lucratividade/${p.processo.id}`} rotulo={`Abrir a lucratividade de ${p.processo.empreendimento}`} className="px-2" />
              </tr>
            ))}
          </tbody>
        </table>
        {lista.length === 0 && <Vazio>Nenhum projeto neste filtro.</Vazio>}
      </Card>
      <p className="mt-2 max-w-[110ch] text-xs text-muted">
        Margem = faturado − custos diretos − equipe (estimado). Boa a partir de {formatarPercentual(MARGEM_BOA)}, atenção de {formatarPercentual(MARGEM_MINIMA)} a{' '}
        {formatarPercentual(MARGEM_BOA)}, ruim abaixo de {formatarPercentual(MARGEM_MINIMA)}. Só entram projetos com proposta aceita.
      </p>
      <Paginacao {...paginado} href={(n) => link({ pagina: String(n) })} />
    </>
  )
}

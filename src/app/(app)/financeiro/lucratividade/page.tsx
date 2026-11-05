import type { Metadata } from 'next'
import { LinkRapido } from '@/components/ui/link-rapido'
import { Busca } from '@/components/ui/busca'
import { Card } from '@/components/ui/card'
import { Vazio } from '@/components/ui/expansivel'
import { PageHeader } from '@/components/ui/page-header'
import { Paginacao } from '@/components/ui/paginacao'
import { ItemResumo, Resumo } from '@/components/ui/resumo'
import { SegmentedLinks } from '@/components/ui/segmented-links'
import { lucratividadePorProjeto } from '@/data/financeiro'
import { exigirArea } from '@/data/sessao'
import { MARGEM_BOA, MARGEM_MINIMA, porMargem, resumoDaLucratividade, type SituacaoMargem } from '@/domain/financeiro/lucratividade'
import { combina } from '@/lib/buscar'
import { brl, contar, formatarPercentual } from '@/lib/formatar'
import { paginar } from '@/lib/paginar'
import { AbrirLinha } from '../_components/abrir-linha'
import { AvisoDeSimulacao, MARGENS, Margem } from './_components/margem'

export const metadata: Metadata = { title: 'Lucratividade por projeto' }

type Filtros = { q?: string; margem?: string; pagina?: string }

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

  return (
    <>
      <PageHeader titulo="Lucratividade por projeto" resumo={`${contar(projetos.length, 'projeto', 'projetos')} com proposta aceita.`} />

      <AvisoDeSimulacao className="mb-4" />

      <Resumo className="mb-6">
        <ItemResumo
          rotulo="Margem média"
          valor={resumo.margemPct === undefined ? '—' : formatarPercentual(resumo.margemPct)}
          detalhe={`${brl(resumo.margem)} sobre o faturado`}
          tom={resumo.margemPct === undefined ? 'neutral' : resumo.margemPct >= MARGEM_BOA ? 'ok' : resumo.margemPct >= MARGEM_MINIMA ? 'warn' : 'danger'}
        />
        <ItemResumo rotulo="Receita × custo" valor={brl(resumo.receita)} detalhe={`custo de ${brl(resumo.custo)} (diretos + equipe)`} />
        <ItemResumo
          rotulo="Mais lucrativo"
          valor={resumo.melhor ? formatarPercentual(resumo.melhor.margemPct!) : '—'}
          detalhe={resumo.melhor?.processo.empreendimento}
          tom="ok"
        />
        <ItemResumo
          rotulo="Menos lucrativo"
          valor={resumo.pior ? formatarPercentual(resumo.pior.margemPct!) : '—'}
          detalhe={resumo.pior?.processo.empreendimento}
          tom={resumo.pior?.situacao === 'ruim' ? 'danger' : resumo.pior?.situacao === 'atencao' ? 'warn' : 'neutral'}
        />
      </Resumo>

      <div className="mb-3 flex flex-wrap items-center gap-2">
        <Busca valor={q} placeholder="Buscar projeto, cliente, grupo ou nº SEI" manter={{ margem }} limpar={link({ q: undefined })} className="min-w-60" />
        <SegmentedLinks
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
      </div>

      <Card flush>
        <table className="tabela">
          <thead>
            <tr>
              <th>Projeto</th>
              <th className="num hidden xl:table-cell">Contrato</th>
              <th className="num hidden sm:table-cell">Faturado</th>
              <th className="num hidden xl:table-cell">Custos diretos</th>
              <th className="num hidden xl:table-cell">Equipe (estimado)</th>
              <th className="num">Margem</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {paginado.itens.map((p) => (
              <tr key={p.processo.id}>
                <td className="sm:min-w-56">
                  <LinkRapido href={`/financeiro/lucratividade/${p.processo.id}`} className="link">
                    {p.processo.empreendimento}
                  </LinkRapido>
                  <p className="text-xs text-subtle">{p.cliente.nome}</p>
                </td>
                <td className="num hidden text-muted xl:table-cell">{brl(p.contratado)}</td>
                <td className="num hidden sm:table-cell">{brl(p.faturado)}</td>
                <td className="num hidden xl:table-cell">{brl(p.custosDiretos)}</td>
                <td className="num hidden text-muted md:table-cell">{brl(p.custoEquipe)}</td>
                <td className="num whitespace-nowrap">
                  {p.margem !== undefined && <span className="mr-2 hidden font-medium tabular-nums sm:inline">{brl(p.margem)}</span>}
                  <Margem margemPct={p.margemPct} situacao={p.situacao} />
                </td>
                <AbrirLinha href={`/financeiro/lucratividade/${p.processo.id}`} rotulo={`Abrir a lucratividade de ${p.processo.empreendimento}`} />
              </tr>
            ))}
          </tbody>
        </table>
        {lista.length === 0 && <Vazio>Nenhum projeto neste filtro.</Vazio>}
      </Card>
      <p className="mt-2 text-xs text-subtle">
        Margem = faturado − custos diretos − equipe (estimado). Boa a partir de {formatarPercentual(MARGEM_BOA)}, atenção de {formatarPercentual(MARGEM_MINIMA)} a{' '}
        {formatarPercentual(MARGEM_BOA)}, ruim abaixo de {formatarPercentual(MARGEM_MINIMA)}. Só entram processos com proposta aceita.
      </p>
      <Paginacao {...paginado} href={(n) => link({ pagina: String(n) })} />
    </>
  )
}

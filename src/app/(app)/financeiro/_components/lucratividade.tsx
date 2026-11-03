import Link from 'next/link'
import { Badge, type Tom } from '@/components/ui/badge'
import { Busca } from '@/components/ui/busca'
import { Card } from '@/components/ui/card'
import { Vazio } from '@/components/ui/expansivel'
import { Paginacao } from '@/components/ui/paginacao'
import { ItemResumo, Resumo } from '@/components/ui/resumo'
import { SegmentedLinks } from '@/components/ui/segmented-links'
import { Situacao } from '@/components/ui/situacao'
import { lucratividadePorProjeto } from '@/data/financeiro'
import { CUSTO_HORA_EQUIPE, MARGEM_BOA, MARGEM_MINIMA, porMargem, resumoDaLucratividade, type SituacaoMargem } from '@/domain/financeiro/lucratividade'
import { combina } from '@/lib/buscar'
import { cn } from '@/lib/cn'
import { brl, formatarPercentual } from '@/lib/formatar'
import { paginar } from '@/lib/paginar'
import { AbrirLinha } from './abrir-linha'

export const MARGENS: Record<SituacaoMargem, { rotulo: string; tom: Tom }> = {
  boa: { rotulo: 'Boa', tom: 'ok' },
  atencao: { rotulo: 'Atenção', tom: 'warn' },
  ruim: { rotulo: 'Ruim', tom: 'danger' },
}

/** O selo e a frase que dizem o que é simulado (vão na aba e no detalhe do projeto). */
export function AvisoDeSimulacao({ className }: { className?: string }) {
  return (
    <p className={cn('flex flex-wrap items-baseline gap-x-2 gap-y-1 text-sm text-muted', className)}>
      <Badge tom="warn">Simulação</Badge>
      <span>
        Contrato, faturado, recebido e custos diretos vêm das notas e dos lançamentos ligados ao processo (dados fictícios). O custo da equipe é estimado: horas
        simuladas × {brl(CUSTO_HORA_EQUIPE)}/h, até a equipe registrar as horas.
      </span>
    </p>
  )
}

export function Margem({ margemPct, situacao }: { margemPct?: number; situacao?: SituacaoMargem }) {
  if (margemPct === undefined || !situacao) return <span className="text-sm text-subtle">sem faturamento</span>
  return <Situacao tom={MARGENS[situacao].tom}>{formatarPercentual(margemPct)}</Situacao>
}

type Filtros = { q?: string; margem?: string; pagina?: string }

/** Aba "Lucratividade por projeto" do Faturamento. `link` monta a URL do Faturamento com os filtros desta aba. */
export async function AbaLucratividade({ filtros, link, manter }: { filtros: Filtros; link: (novos: Filtros) => string; manter: Record<string, string | undefined> }) {
  const projetos = await lucratividadePorProjeto()
  const q = filtros.q?.trim() || undefined
  const margem = filtros.margem && filtros.margem in MARGENS ? (filtros.margem as SituacaoMargem) : undefined
  const resumo = resumoDaLucratividade(projetos)

  const buscados = projetos.filter(({ processo, cliente }) => combina(q, processo.empreendimento, cliente.nome, cliente.grupo, processo.numeroSei))
  const lista = buscados.filter((p) => !margem || p.situacao === margem).sort(porMargem)
  const paginado = paginar(lista, filtros.pagina)

  return (
    <>
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
        <Busca valor={q} placeholder="Buscar projeto, cliente, grupo ou nº SEI" manter={{ ...manter, margem }} limpar={link({ margem, q: undefined })} className="min-w-60" />
        <SegmentedLinks
          ativo={margem ?? 'todas'}
          opcoes={[
            { valor: 'todas', rotulo: 'Todas', href: link({ q }), contagem: buscados.length },
            ...Object.entries(MARGENS).map(([valor, { rotulo }]) => ({
              valor,
              rotulo,
              href: link({ q, margem: valor }),
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
              <th className="num hidden md:table-cell">Custos diretos</th>
              <th className="num hidden md:table-cell">Equipe (estimado)</th>
              <th className="num">Margem</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {paginado.itens.map((p) => (
              <tr key={p.processo.id}>
                <td className="sm:min-w-56">
                  <Link href={`/financeiro/lucratividade/${p.processo.id}`} className="link">
                    {p.processo.empreendimento}
                  </Link>
                  <p className="text-xs text-subtle">{p.cliente.nome}</p>
                </td>
                <td className="num hidden text-muted xl:table-cell">{brl(p.contratado)}</td>
                <td className="num hidden sm:table-cell">{brl(p.faturado)}</td>
                <td className="num hidden md:table-cell">{brl(p.custosDiretos)}</td>
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
      <Paginacao {...paginado} href={(n) => link({ q, margem, pagina: String(n) })} />
    </>
  )
}

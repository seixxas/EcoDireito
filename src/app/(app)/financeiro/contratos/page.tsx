import type { Metadata } from 'next'
import { LinkRapido } from '@/components/ui/link-rapido'
import { Badge } from '@/components/ui/badge'
import { Busca } from '@/components/ui/busca'
import { Card } from '@/components/ui/card'
import { Vazio } from '@/components/ui/expansivel'
import { classeBotao } from '@/components/ui/form'
import { PageHeader } from '@/components/ui/page-header'
import { Paginacao } from '@/components/ui/paginacao'
import { listarContratos } from '@/data/financeiro'
import { exigirArea } from '@/data/sessao'
import type { SituacaoParcela } from '@/domain/financeiro/parcelas'
import { combina } from '@/lib/buscar'
import { cn } from '@/lib/cn'
import { somar } from '@/lib/dinheiro'
import { brl, contar, formatarPercentual } from '@/lib/formatar'
import { paginar } from '@/lib/paginar'
import { pode } from '@/lib/permissoes'
import { NoCartao, TABELA_EMPILHADA } from '../_components/tabela-empilhada'
import { BARRA_DA_COPA, LINHA_DA_COPA } from '../_components/identidade'

export const metadata: Metadata = { title: 'Contratos' }

type Item = Awaited<ReturnType<typeof listarContratos>>[number]['parcelas'][number]

const total = (parcelas: Item[], ...situacoes: SituacaoParcela[]) =>
  somar(parcelas.filter((p) => !situacoes.length || situacoes.includes(p.situacao)).map((p) => p.parcela.valor))

/** Serviço e parcelas só ganham coluna onde sobra lugar; antes disso, vão embaixo do nome do projeto. */
const SO_EM_TELA_GRANDE = 'hidden! min-[90rem]:table-cell!'

function LinhaDoTotal({ cor, rotulo, detalhe, valor }: { cor: string; rotulo: string; detalhe?: string; valor: string }) {
  return (
    <div className="grid grid-cols-[0.75rem_minmax(0,1fr)_auto] items-baseline gap-1.5 text-sm">
      <i className={cn('size-3 self-center rounded-xs', cor)} />
      <dt>
        {rotulo}
        {detalhe && <small className="block text-2xs text-muted">{detalhe}</small>}
      </dt>
      <dd className="text-right text-sm font-semibold">{valor}</dd>
    </div>
  )
}

export default async function PaginaContratos({ searchParams }: { searchParams: Promise<{ q?: string; pagina?: string }> }) {
  const [filtros, usuario, contratos] = await Promise.all([searchParams, exigirArea('financeiro'), listarContratos()])
  const editar = pode(usuario.papel, 'financeiro', 'editar')
  // Só conta o que foi aceito. Proposta em aberto fica numa linha à parte (o funil está no Comercial); recusada some.
  const fechados = contratos.filter((c) => c.situacao === 'fechado')
  const emAberto = contratos.filter((c) => c.situacao === 'proposta').flatMap((c) => c.parcelas)
  const propostasEmAberto = contratos.filter((c) => c.situacao === 'proposta' && c.parcelas.length).length
  const todas = fechados.flatMap((c) => c.parcelas)
  const q = filtros.q?.trim() || undefined
  const encontrados = fechados.filter(({ processo, cliente }) => combina(q, processo.empreendimento, cliente.nome, cliente.grupo, processo.numeroSei))
  const paginado = paginar(encontrados, filtros.pagina)
  const link = (pagina: number) => {
    const params = new URLSearchParams({ ...(q && { q }), ...(pagina > 1 && { pagina: String(pagina) }) })
    return params.size ? `/financeiro/contratos?${params}` : '/financeiro/contratos'
  }

  const contratado = total(todas)
  const faturado = total(todas, 'faturada', 'recebida')
  const pronto = total(todas, 'liberada')
  const aguardando = total(todas, 'aguardando')
  const parte = (valor: number) => (contratado ? valor / contratado : 0)

  return (
    <>
      <PageHeader
        titulo="Contratos"
        resumo={`${brl(pronto)} pronto para faturar. A parcela fica pronta quando o evento dela é lançado no projeto.`}
        acoes={
          editar &&
          pronto > 0 && (
            <LinkRapido href="/financeiro?aba=a-faturar" className={classeBotao('primario')}>
              Faturar as parcelas prontas
            </LinkRapido>
          )
        }
      />

      <section aria-label="Totais dos contratos" className={cn('grid items-center gap-x-6 gap-y-2 rounded-lg bg-painel px-4 py-2.5 lg:grid-cols-[13rem_minmax(0,1fr)]', LINHA_DA_COPA)}>
        <div>
          <p className="text-xs text-subtle">Contratado</p>
          <p className="text-xl font-semibold">{brl(contratado)}</p>
          <p className="text-xs text-muted">{contar(fechados.filter((c) => c.parcelas.length).length, 'contrato', 'contratos')}</p>
        </div>
        <div>
          <div
            role="img"
            aria-label={`Do total contratado: ${formatarPercentual(parte(faturado))} faturado, ${formatarPercentual(parte(pronto))} pronto para faturar e ${formatarPercentual(parte(aguardando))} aguardando evento`}
            className="mb-1.5 flex h-2 gap-0.5 overflow-hidden rounded-full"
          >
            <span className={BARRA_DA_COPA} style={{ width: `${parte(faturado) * 100}%` }} />
            <span className="bg-brand-300" style={{ width: `${parte(pronto) * 100}%` }} />
            <span className="bg-line" style={{ width: `${parte(aguardando) * 100}%` }} />
          </div>
          <dl className="grid gap-x-6 gap-y-0.5 sm:grid-cols-3">
            <LinhaDoTotal cor="bg-brand-700" rotulo="Faturado" valor={brl(faturado)} />
            <LinhaDoTotal cor="bg-brand-300" rotulo="Pronto para faturar" detalhe="o evento já aconteceu" valor={brl(pronto)} />
            <LinhaDoTotal cor="border border-campo bg-line" rotulo="Aguardando evento" valor={brl(aguardando)} />
          </dl>
        </div>
      </section>

      {propostasEmAberto > 0 && (
        <p className="mt-2 text-xs text-muted">
          Fora destes totais: {brl(total(emAberto))} em {contar(propostasEmAberto, 'proposta em aberto', 'propostas em aberto')}, que entram aqui quando o cliente aceita
          {pode(usuario.papel, 'comercial') ? (
            <>
              .{' '}
              <LinkRapido href="/comercial" className="link">
                Ver em Propostas
              </LinkRapido>
            </>
          ) : (
            '.'
          )}
        </p>
      )}

      <Busca valor={q} placeholder="Projeto, cliente, grupo ou nº SEI" limpar="/financeiro/contratos" className="mb-4 mt-3" />
      <Card flush>
        <table className={`${TABELA_EMPILHADA} max-[48rem]:[&_td:last-child]:ml-auto`}>
          <thead>
            <tr>
              <th>Projeto</th>
              <th className={SO_EM_TELA_GRANDE}>Serviço</th>
              <th className={cn('num', SO_EM_TELA_GRANDE)}>Parcelas</th>
              <th className="num">Contrato</th>
              <th className="num">Faturado</th>
              <th className="num">Pronto para faturar</th>
              {editar && <th className="num">Ação</th>}
            </tr>
          </thead>
          <tbody>
            {paginado.itens.map(({ processo, cliente, parcelas }) => {
              const servico = processo.servico === 'manejo' ? 'Manejo' : 'Licenciamento'
              const aFaturar = total(parcelas, 'liberada')
              return (
                <tr key={processo.id}>
                  <td className="min-w-0 min-[48rem]:min-w-52">
                    <LinkRapido href={`/projetos/${processo.id}`} className="link text-ink">
                      {processo.empreendimento}
                    </LinkRapido>
                    <p className="text-xs text-muted">
                      {cliente.nome}
                      <span className="min-[90rem]:hidden">
                        {' '}
                        · {servico} · {contar(parcelas.length, 'parcela', 'parcelas')}
                      </span>
                    </p>
                  </td>
                  <td className={SO_EM_TELA_GRANDE}>{servico}</td>
                  <td className={cn('num', SO_EM_TELA_GRANDE)}>{parcelas.length || '—'}</td>
                  <td className="num">
                    <NoCartao>Contrato</NoCartao>
                    {parcelas.length ? brl(total(parcelas)) : '—'}
                  </td>
                  <td className="num">
                    <NoCartao>Faturado</NoCartao>
                    {brl(total(parcelas, 'faturada', 'recebida'))}
                  </td>
                  <td className={cn('num', !aFaturar && 'font-normal text-subtle')}>
                    <NoCartao>Pronto para faturar</NoCartao>
                    {aFaturar ? (
                      <span className="inline-flex flex-col items-end gap-0.5 max-[48rem]:items-start max-sm:items-end">
                        <Badge tom="ok">Pronto</Badge>
                        {brl(aFaturar)}
                      </span>
                    ) : (
                      'Nada pronto'
                    )}
                  </td>
                  {editar && (
                    <td className="text-right">
                      <LinkRapido href={`/financeiro/contratos/${processo.id}`} className={classeBotao('secundario', undefined, 'pequeno')}>
                        {parcelas.length ? 'Editar parcelas' : 'Montar contrato'}
                      </LinkRapido>
                    </td>
                  )}
                </tr>
              )
            })}
          </tbody>
        </table>
        {encontrados.length === 0 && <Vazio>Nenhum projeto com “{q}”.</Vazio>}
      </Card>
      <Paginacao {...paginado} href={link} />
    </>
  )
}

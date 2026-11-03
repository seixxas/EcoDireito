import { X } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { SituacaoDaNota } from '@/components/financeiro/situacao-nota'
import { Busca } from '@/components/ui/busca'
import { Card } from '@/components/ui/card'
import { Vazio } from '@/components/ui/expansivel'
import { Linha, Lista } from '@/components/ui/lista'
import { PageHeader } from '@/components/ui/page-header'
import { Paginacao } from '@/components/ui/paginacao'
import { ItemResumo, Resumo } from '@/components/ui/resumo'
import { Secao } from '@/components/ui/secao'
import { SegmentedLinks } from '@/components/ui/segmented-links'
import { listarNotas } from '@/data/financeiro'
import { diasDeAtraso, resumoNotas, saldoAReceber, situacaoNota } from '@/domain/financeiro/notas'
import { combina } from '@/lib/buscar'
import { cn } from '@/lib/cn'
import { diasEntre } from '@/lib/datas'
import { somar } from '@/lib/dinheiro'
import { brl, contar, formatarDataCurta } from '@/lib/formatar'
import { paginar } from '@/lib/paginar'
import { AbrirLinha } from '../_components/abrir-linha'

export const metadata: Metadata = { title: 'Contas a receber' }

const FAIXAS = [
  { id: 'a-vencer', rotulo: 'A vencer', de: -Infinity, ate: 0, cor: 'bg-brand-300' },
  { id: '1-15', rotulo: '1 a 15 dias de atraso', de: 1, ate: 15, cor: 'bg-accent/50' },
  { id: '16-30', rotulo: '16 a 30 dias', de: 16, ate: 30, cor: 'bg-accent' },
  { id: '31-60', rotulo: '31 a 60 dias', de: 31, ate: 60, cor: 'bg-danger/70' },
  { id: '60+', rotulo: 'Mais de 60 dias', de: 61, ate: Infinity, cor: 'bg-danger' },
]

type Aberta = { atraso: number; parcial: boolean }

/** Atrasada e "a vencer" se excluem; "recebida em parte" pode ser qualquer uma das duas. */
const SITUACOES: { valor: string; rotulo: string; filtro: (nota: Aberta) => boolean }[] = [
  { valor: 'todas', rotulo: 'Todas', filtro: () => true },
  { valor: 'atrasadas', rotulo: 'Atrasadas', filtro: (n) => n.atraso > 0 },
  { valor: 'a-vencer', rotulo: 'A vencer', filtro: (n) => n.atraso === 0 },
  { valor: 'parcial', rotulo: 'Recebidas em parte', filtro: (n) => n.parcial },
]

/** "Maiores saldos" mostra só os maiores; o título diz de quantos. */
const MAIORES_SALDOS = 6

type Filtros = { q?: string; situacao?: string; faixa?: string; pagina?: string }

export default async function PaginaReceber({ searchParams }: { searchParams: Promise<Filtros> }) {
  const [filtros, { hoje: dia, notas }] = await Promise.all([searchParams, listarNotas()])
  const q = filtros.q?.trim() || undefined
  const situacao = SITUACOES.find((s) => s.valor === filtros.situacao) ?? SITUACOES[0]
  const faixa = FAIXAS.find((f) => f.id === filtros.faixa)
  const link = (novos: Filtros) => {
    const f = { q, situacao: situacao.valor, faixa: faixa?.id, ...novos }
    const params = new URLSearchParams()
    if (f.q) params.set('q', f.q)
    if (f.situacao && f.situacao !== 'todas') params.set('situacao', f.situacao)
    if (f.faixa) params.set('faixa', f.faixa)
    if (f.pagina && f.pagina !== '1') params.set('pagina', f.pagina)
    return params.size ? `/financeiro/receber?${params}` : '/financeiro/receber'
  }

  const abertas = notas
    .filter(({ nota }) => saldoAReceber(nota, dia) > 0)
    .map((item) => ({
      ...item,
      atraso: diasDeAtraso(item.nota, dia),
      saldo: saldoAReceber(item.nota, dia),
      parcial: situacaoNota(item.nota, dia) === 'parcial',
    }))
    .sort((a, b) => b.atraso - a.atraso || a.nota.previsao.localeCompare(b.nota.previsao))
  const naFaixa = (item: Aberta, f: (typeof FAIXAS)[number]) => item.atraso >= f.de && item.atraso <= f.ate

  // Busca, situação e faixa se somam. Cada filtro conta o que os outros dois deixam passar.
  const buscadas = abertas.filter(({ nota, cliente, processo }) => combina(q, cliente.nome, cliente.grupo, nota.numero, nota.descricao, processo?.empreendimento))
  const paraFaixas = buscadas.filter(situacao.filtro)
  const paraSituacoes = faixa ? buscadas.filter((item) => naFaixa(item, faixa)) : buscadas
  const lista = faixa ? paraFaixas.filter((item) => naFaixa(item, faixa)) : paraFaixas
  const paginado = paginar(lista, filtros.pagina)

  const resumo = resumoNotas(notas.map(({ nota }) => nota), dia)
  const total = somar(abertas.map((a) => a.saldo))
  const proximos30 = somar(abertas.filter((a) => a.atraso === 0 && diasEntre(dia, a.nota.previsao) <= 30).map((a) => a.saldo))
  const faixas = FAIXAS.map((f) => {
    const itens = paraFaixas.filter((item) => naFaixa(item, f))
    return { ...f, quantidade: itens.length, valor: somar(itens.map((a) => a.saldo)) }
  })
  const totalDasFaixas = somar(faixas.map((f) => f.valor))

  const porGrupo = Object.entries(
    abertas.reduce<Record<string, { valor: number; busca: string }>>((grupos, { cliente, saldo }) => {
      const chave = cliente.grupo ? `Grupo ${cliente.grupo}` : cliente.nome
      grupos[chave] = { valor: (grupos[chave]?.valor ?? 0) + saldo, busca: cliente.grupo ?? cliente.nome }
      return grupos
    }, {}),
  ).sort((a, b) => b[1].valor - a[1].valor)

  return (
    <>
      <PageHeader
        titulo="Contas a receber"
        resumo={`${brl(total)} em ${contar(abertas.length, 'nota aberta', 'notas abertas')}; ${brl(resumo.atrasado)} já passou da previsão. Notas com retenção aparecem pelo líquido.`}
      />

      <Resumo className="mb-8">
        <ItemResumo rotulo="A receber" valor={brl(total)} detalhe={contar(abertas.length, 'nota', 'notas')} />
        <ItemResumo
          rotulo="Atrasado"
          valor={brl(resumo.atrasado)}
          detalhe={contar(resumo.quantidadeAtrasadas, 'nota', 'notas')}
          tom={resumo.atrasado ? 'danger' : 'neutral'}
        />
        <ItemResumo rotulo="Entra em 30 dias" valor={brl(proximos30)} detalhe="pela previsão" tom="ok" />
        <ItemResumo rotulo="Prazo para receber" valor={contar(resumo.prazoMedianoDias, 'dia', 'dias')} detalhe="mediana, da emissão ao pagamento" />
      </Resumo>

      <Secao
        titulo="Por tempo de atraso"
        acao={
          faixa ? (
            <Link href={link({ faixa: undefined })} className="link text-sm">
              mostrar todas as faixas
            </Link>
          ) : (
            <span className="text-sm text-muted">clique numa faixa para filtrar a lista</span>
          )
        }
      >
        <div className="flex h-3 overflow-hidden rounded-full bg-rail">
          {faixas.map((f) => (
            <div key={f.id} title={`${f.rotulo}: ${brl(f.valor)}`} className={f.cor} style={{ width: `${totalDasFaixas ? (f.valor / totalDasFaixas) * 100 : 0}%` }} />
          ))}
        </div>
        <ul className="mt-4 grid grid-cols-2 gap-2 lg:grid-cols-5">
          {faixas.map((f) => {
            const ativa = faixa?.id === f.id
            return (
              <li key={f.id}>
                <Link
                  href={link({ faixa: ativa ? undefined : f.id })}
                  scroll={false}
                  aria-current={ativa || undefined}
                  className={cn(
                    'block rounded-lg border px-3 py-2 text-sm transition-colors',
                    ativa ? 'border-brand-700 bg-brand-50' : 'border-line bg-surface hover:border-brand-300 hover:bg-brand-50',
                    f.quantidade === 0 && !ativa && 'opacity-60',
                  )}
                >
                  <span className="flex items-center gap-2">
                    <span className={cn('size-2.5 shrink-0 rounded-full', f.cor)} />
                    <span className="flex-1 text-ink">{f.rotulo}</span>
                    {ativa && <X className="size-3.5 text-muted" />}
                  </span>
                  <span className="mt-1 block pl-4.5 font-medium tabular-nums text-ink">{brl(f.valor)}</span>
                  <span className="block pl-4.5 text-xs text-subtle">{contar(f.quantidade, 'nota', 'notas')}</span>
                </Link>
              </li>
            )
          })}
        </ul>
      </Secao>

      <Secao titulo={`${contar(lista.length, 'nota em aberto', 'notas em aberto')}, as mais atrasadas primeiro`}>
        {/* Âncora para os links de "Maiores saldos", que ficam abaixo da lista. */}
        <div id="notas" className="mb-3 flex scroll-mt-4 flex-wrap items-center gap-2">
          <Busca
            valor={q}
            placeholder="Buscar empresa, grupo ou nº da NF"
            manter={{ situacao: situacao.valor === 'todas' ? undefined : situacao.valor, faixa: faixa?.id }}
            limpar={link({ q: undefined })}
            className="min-w-60"
          />
          <SegmentedLinks
            ativo={situacao.valor}
            opcoes={SITUACOES.map((s) => ({ valor: s.valor, rotulo: s.rotulo, href: link({ situacao: s.valor }), contagem: paraSituacoes.filter(s.filtro).length }))}
          />
          {faixa && (
            <Link
              href={link({ faixa: undefined })}
              scroll={false}
              title="Tirar o filtro de faixa"
              className="inline-flex h-9 items-center gap-1.5 rounded-md border border-line bg-surface px-2.5 text-sm text-ink hover:bg-brand-50"
            >
              <span className={cn('size-2 rounded-full', faixa.cor)} />
              {faixa.rotulo} <X className="size-3.5 text-muted" />
            </Link>
          )}
        </div>
        <Card flush>
          <table className="tabela">
            <thead>
              <tr>
                <th>Cliente</th>
                <th className="hidden sm:table-cell">NF</th>
                <th className="hidden sm:table-cell">Previsão</th>
                <th className="num">Atraso</th>
                <th className="num">Saldo</th>
                <th className="hidden sm:table-cell">Situação</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {paginado.itens.map(({ nota, cliente, atraso, saldo }) => (
                <tr key={nota.id}>
                  <td className="sm:min-w-60">
                    {cliente.nome}
                    <p className="text-xs text-subtle">
                      {nota.descricao}
                      {/* No celular a coluna NF some; o número vem para cá. */}
                      <span className="sm:hidden"> · NF {nota.numero}</span>
                    </p>
                  </td>
                  <td className="hidden tabular-nums sm:table-cell">
                    <Link href={`/financeiro/notas/${nota.id}`} className="link">
                      {nota.numero}
                    </Link>
                  </td>
                  <td className="hidden whitespace-nowrap sm:table-cell">{formatarDataCurta(nota.previsao)}</td>
                  <td className={cn('num', atraso > 30 ? 'font-medium text-danger' : atraso > 0 && 'text-warn')}>{atraso ? contar(atraso, 'dia', 'dias') : '—'}</td>
                  <td className="num font-medium">{brl(saldo)}</td>
                  <td className="hidden sm:table-cell">
                    <SituacaoDaNota situacao={situacaoNota(nota, dia)} />
                  </td>
                  <AbrirLinha href={`/financeiro/notas/${nota.id}`} rotulo={`Abrir NF ${nota.numero}`} />
                </tr>
              ))}
            </tbody>
          </table>
          {lista.length === 0 && <Vazio>{abertas.length ? 'Nenhuma nota em aberto neste filtro.' : 'Nenhuma nota em aberto.'}</Vazio>}
        </Card>
        <Paginacao {...paginado} href={(n) => link({ pagina: String(n) })} />
      </Secao>

      <Secao
        titulo="Maiores saldos a receber"
        acao={porGrupo.length > MAIORES_SALDOS && <span className="text-sm text-muted">os {MAIORES_SALDOS} maiores de {porGrupo.length}</span>}
      >
        <p className="-mt-1 mb-3 text-sm text-muted">Por empresa ou grupo, somando o que já atrasou e o que ainda vai vencer. Clique para ver as notas.</p>
        <div className="max-w-2xl">
          <Lista>
            {porGrupo.slice(0, MAIORES_SALDOS).map(([nome, { valor, busca }]) => (
              <Linha key={nome} href={`${link({ q: busca, situacao: 'todas', faixa: undefined })}#notas`}>
                <span className="min-w-0 flex-1 truncate">{nome}</span>
                <span className="font-medium tabular-nums">{brl(valor)}</span>
              </Linha>
            ))}
          </Lista>
        </div>
      </Secao>
    </>
  )
}

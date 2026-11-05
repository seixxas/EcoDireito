import { X } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { Busca } from '@/components/ui/busca'
import { Card } from '@/components/ui/card'
import { Expansivel } from '@/components/ui/expansivel'
import { PageHeader } from '@/components/ui/page-header'
import { Paginacao } from '@/components/ui/paginacao'
import { listarLancamentos } from '@/data/financeiro'
import { exigirArea } from '@/data/sessao'
import { CONTAS, nomeDaConta } from '@/domain/financeiro/plano-de-contas'
import { combina } from '@/lib/buscar'
import { cn } from '@/lib/cn'
import { mesDe } from '@/lib/datas'
import { somar } from '@/lib/dinheiro'
import { brl, contar, formatarDataCurta, formatarMes, juntar } from '@/lib/formatar'
import { paginar } from '@/lib/paginar'
import { pode } from '@/lib/permissoes'
import { AbrirLinha } from '../_components/abrir-linha'
import { EXPLICACAO_COMPETENCIA, textoDaCompetencia } from '../_components/competencia'
import { FiltroConta } from '../_components/filtro-conta'
import { NavegacaoMes, TODOS_OS_MESES } from '../_components/navegacao-mes'
import { FormularioLancamento } from './_components/formulario-lancamento'

export const metadata: Metadata = { title: 'Lançamentos' }

/** `processo` é o link da lucratividade. */
type Filtros = { mes?: string; q?: string; conta?: string; processo?: string; pagina?: string; novo?: string }

export default async function PaginaLancamentos({ searchParams }: { searchParams: Promise<Filtros> }) {
  const [filtros, usuario, { hoje: dia, meses, lancamentos, processos }] = await Promise.all([searchParams, exigirArea('financeiro'), listarLancamentos()])
  const editar = pode(usuario.papel, 'financeiro', 'editar')
  const atual = mesDe(dia)
  const mes = filtros.mes === TODOS_OS_MESES || meses.includes(filtros.mes ?? '') ? filtros.mes! : atual
  const conta = CONTAS.find((c) => c.id === filtros.conta)?.id
  const q = filtros.q?.trim() || undefined
  const nomeDoProcesso = (id?: string) => processos.find((p) => p.id === id)?.empreendimento
  const processo = processos.find((p) => p.id === filtros.processo)

  const link = (novos: Partial<Filtros>) => {
    const f = { mes, q, conta, processo: processo?.id, ...novos }
    const params = new URLSearchParams()
    if (f.mes && f.mes !== atual) params.set('mes', f.mes)
    if (f.processo) params.set('processo', f.processo)
    if (f.conta) params.set('conta', f.conta)
    if (f.q) params.set('q', f.q)
    if (f.pagina && f.pagina !== '1') params.set('pagina', f.pagina)
    return params.size ? `/financeiro/lancamentos?${params}` : '/financeiro/lancamentos'
  }

  const filtrados = lancamentos
    .filter(
      (l) =>
        (mes === TODOS_OS_MESES ? meses.includes(mesDe(l.data)) : mesDe(l.data) === mes) &&
        (!conta || l.contaId === conta) &&
        (!processo || l.processoId === processo.id) &&
        combina(q, l.descricao, l.observacao, nomeDaConta(l.contaId), nomeDoProcesso(l.processoId), brl(l.valor)),
    )
    .sort((a, b) => b.data.localeCompare(a.data))
  const paginado = paginar(filtrados, filtros.pagina)
  const entradas = somar(filtrados.filter((l) => l.valor > 0).map((l) => l.valor))
  const saidas = somar(filtrados.filter((l) => l.valor < 0).map((l) => l.valor))

  const periodo = mes === TODOS_OS_MESES ? 'em todos os meses' : `em ${formatarMes(mes)}`
  const filtrado = Boolean(q || conta || processo)
  // Filtrado por uma conta de despesa, "entraram R$ 0,00" só atrapalha.
  const movimento = juntar([entradas ? `entraram ${brl(entradas)}` : '', saidas ? `saíram ${brl(-saidas)}` : ''].filter(Boolean))

  return (
    <>
      <PageHeader
        titulo="Lançamentos"
        resumo={`${contar(filtrados.length, 'lançamento', 'lançamentos')} ${periodo}${conta ? ` em ${nomeDaConta(conta)}` : ''}${processo ? ` do ${processo.empreendimento}` : ''}${movimento ? `: ${movimento}` : ''}.${filtrado ? '' : ' A receita das notas entra sozinha com o recebimento.'}`}
        acoes={<NavegacaoMes mes={mes} meses={meses} href={(m) => link({ mes: m })} todos />}
      />

      {editar && (
        <Expansivel resumo="Novo lançamento" aberto={filtros.novo === '1'} className="mb-6">
          <Card>
            <FormularioLancamento hoje={dia} processos={processos.map((p) => ({ id: p.id, nome: p.empreendimento }))} />
          </Card>
        </Expansivel>
      )}

      <div className="mb-3 flex flex-wrap items-center gap-2">
        <Busca
          valor={q}
          placeholder="Buscar na descrição, observação ou processo"
          manter={{ mes: mes === atual ? undefined : mes, conta, processo: processo?.id }}
          limpar={link({ q: undefined })}
          className="min-w-60"
        />
        <FiltroConta valor={conta} manter={{ mes: mes === atual ? undefined : mes, processo: processo?.id, q }} />
        {processo && (
          <Link
            href={link({ processo: undefined })}
            title="Tirar o filtro de processo"
            className="inline-flex h-9 max-w-full items-center gap-1 rounded-md border border-line bg-surface px-2.5 text-sm text-ink hover:bg-brand-50"
          >
            <span className="truncate">{processo.empreendimento}</span> <X className="size-3.5 shrink-0 text-muted" />
          </Link>
        )}
      </div>

      <Card flush>
        <table className="tabela">
          <thead>
            <tr>
              <th className="hidden sm:table-cell">Data</th>
              <th>Descrição</th>
              <th className="hidden sm:table-cell">Conta</th>
              <th className="num">Valor</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {paginado.itens.map((lancamento) => (
              <tr key={lancamento.id}>
                <td className="hidden whitespace-nowrap sm:table-cell">{formatarDataCurta(lancamento.data)}</td>
                <td className="sm:min-w-64">
                  {lancamento.descricao}
                  {lancamento.observacao && <span className="block text-sm text-muted">Obs.: {lancamento.observacao}</span>}
                  {/* Só quando a competência não é o mês do pagamento: é a exceção que muda a DRE por competência. */}
                  {textoDaCompetencia(lancamento) && (
                    <span className="block text-xs font-medium text-warn" title={EXPLICACAO_COMPETENCIA}>
                      Competência {textoDaCompetencia(lancamento)}
                    </span>
                  )}
                  {/* No celular, data e conta vêm embaixo da descrição. */}
                  <span className="block text-xs text-muted sm:hidden">
                    {formatarDataCurta(lancamento.data)} · {nomeDaConta(lancamento.contaId)}
                  </span>
                  {lancamento.notaId && (
                    <Link href={`/financeiro/notas/${lancamento.notaId}`} className="link block w-fit text-xs">
                      ver nota
                    </Link>
                  )}
                  {!lancamento.notaId && lancamento.processoId && (
                    <Link href={`/processos/${lancamento.processoId}`} className="link block w-fit text-xs">
                      {nomeDoProcesso(lancamento.processoId)}
                    </Link>
                  )}
                </td>
                <td className="hidden text-muted sm:table-cell">{nomeDaConta(lancamento.contaId)}</td>
                <td className={cn('num font-medium', lancamento.valor > 0 && 'text-ok')}>{brl(lancamento.valor)}</td>
                <AbrirLinha href={`/financeiro/lancamentos/${lancamento.id}`} rotulo={editar ? 'Abrir para editar' : 'Abrir lançamento'} />
              </tr>
            ))}
            {filtrados.length === 0 && (
              <tr>
                <td colSpan={5} className="py-10 text-center text-muted">
                  {filtrado ? 'Nenhum lançamento neste filtro.' : 'Nenhum lançamento neste mês.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Card>
      {paginado.itens.some((l) => textoDaCompetencia(l)) && <p className="mt-2 text-xs text-subtle">{EXPLICACAO_COMPETENCIA}</p>}
      <Paginacao {...paginado} href={(n) => link({ pagina: String(n) })} />
    </>
  )
}

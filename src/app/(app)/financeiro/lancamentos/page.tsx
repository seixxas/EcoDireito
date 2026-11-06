import type { Metadata } from 'next'
import { LinkRapido } from '@/components/ui/link-rapido'
import { Busca } from '@/components/ui/busca'
import { Card } from '@/components/ui/card'
import { Vazio } from '@/components/ui/expansivel'
import { classeBotao } from '@/components/ui/form'
import { PageHeader } from '@/components/ui/page-header'
import { Paginacao } from '@/components/ui/paginacao'
import { listarLancamentos } from '@/data/financeiro'
import { exigirArea } from '@/data/sessao'
import { CONTAS, nomeDaConta } from '@/domain/financeiro/plano-de-contas'
import { combina } from '@/lib/buscar'
import { cn } from '@/lib/cn'
import { mesDe } from '@/lib/datas'
import { somar } from '@/lib/dinheiro'
import { brl, contar, formatarData, formatarMes, juntar } from '@/lib/formatar'
import { paginar } from '@/lib/paginar'
import { pode } from '@/lib/permissoes'
import { AbrirLinha, BotaoAbrir } from '../_components/abrir-linha'
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
    if (f.novo) params.set('novo', f.novo)
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
        acoes={
          editar && (
            <LinkRapido href={link({ novo: '1' })} scroll={false} className={classeBotao('primario')}>
              + Novo lançamento
            </LinkRapido>
          )
        }
      />

      {editar && filtros.novo === '1' && (
        <Card
          titulo="Novo lançamento"
          className="mb-4"
          acao={
            <LinkRapido href={link({})} scroll={false} className={classeBotao('secundario')}>
              Fechar
            </LinkRapido>
          }
        >
          <FormularioLancamento hoje={dia} processos={processos.map((p) => ({ id: p.id, nome: p.empreendimento }))} />
        </Card>
      )}

      <div className="mb-4 space-y-4">
        <NavegacaoMes mes={mes} meses={meses} href={(m) => link({ mes: m })} todos />
        <div className="flex flex-wrap items-end gap-3">
          <Busca
            valor={q}
            placeholder="Descrição, observação ou projeto"
            manter={{ mes: mes === atual ? undefined : mes, conta, processo: processo?.id }}
            limpar={link({ q: undefined })}
            className="max-w-95!"
          />
          <FiltroConta acao="/financeiro/lancamentos" valor={conta} manter={{ mes: mes === atual ? undefined : mes, processo: processo?.id, q }} />
          {processo && (
            <LinkRapido href={link({ processo: undefined })} className={classeBotao('secundario', 'max-w-full whitespace-normal! py-1.5 text-left')}>
              Tirar o filtro: {processo.empreendimento}
            </LinkRapido>
          )}
        </div>
      </div>

      <Card flush>
        {filtrados.length === 0 ? (
          <Vazio>{filtrado ? 'Nenhum lançamento neste filtro.' : 'Nenhum lançamento neste mês.'}</Vazio>
        ) : (
          <div className="@container overflow-x-auto">
            <table className="tabela min-w-0">
              <thead className="@max-3xl:hidden">
                <tr>
                  <th>Data</th>
                  <th>Descrição</th>
                  <th className="hidden @min-[58rem]:table-cell">Conta</th>
                  <th className="hidden @min-[58rem]:table-cell">Tipo</th>
                  <th className="num">Valor</th>
                  <th className="num">Ação</th>
                </tr>
              </thead>
              <tbody>
                {paginado.itens.map((lancamento) => {
                  const entrada = lancamento.valor > 0
                  const tipo = entrada ? 'Entrada' : 'Saída'
                  const valor = `${entrada ? '+' : '−'} ${brl(Math.abs(lancamento.valor))}`
                  const rotulo = editar ? 'Abrir para editar' : 'Abrir lançamento'
                  const href = `/financeiro/lancamentos/${lancamento.id}`
                  return (
                    <tr key={lancamento.id}>
                      <td className="hidden whitespace-nowrap @3xl:table-cell">{formatarData(lancamento.data)}</td>
                      <td>
                        {lancamento.descricao}
                        {lancamento.observacao && <span className="block text-xs text-muted">Obs.: {lancamento.observacao}</span>}
                        {/* Só quando a competência não é o mês do pagamento: é a exceção que muda a DRE por competência. */}
                        {textoDaCompetencia(lancamento) && (
                          <span className="block text-sm font-medium text-warn" title={EXPLICACAO_COMPETENCIA}>
                            Competência {textoDaCompetencia(lancamento)}
                          </span>
                        )}
                        <span className="block text-xs text-muted @3xl:hidden">{formatarData(lancamento.data)}</span>
                        <span className="block text-xs text-muted @min-[58rem]:hidden">
                          {nomeDaConta(lancamento.contaId)} · {tipo}
                        </span>
                        <span className={cn('mt-1 block text-sm font-semibold @3xl:hidden', entrada && 'text-ok')}>{valor}</span>
                        {lancamento.notaId && (
                          <LinkRapido href={`/financeiro/notas/${lancamento.notaId}`} className="link block w-fit text-sm">
                            Ver nota
                          </LinkRapido>
                        )}
                        {!lancamento.notaId && lancamento.processoId && (
                          <LinkRapido href={`/projetos/${lancamento.processoId}`} className="link block w-fit text-sm">
                            {nomeDoProcesso(lancamento.processoId)}
                          </LinkRapido>
                        )}
                        <div className="mt-2 @3xl:hidden">
                          <BotaoAbrir href={href} rotulo={rotulo} />
                        </div>
                      </td>
                      <td className="hidden @min-[58rem]:table-cell">{nomeDaConta(lancamento.contaId)}</td>
                      <td className={cn('hidden text-xs font-semibold @min-[58rem]:table-cell', entrada && 'text-ok')}>{tipo}</td>
                      <td className={cn('num hidden @3xl:table-cell', entrada && 'text-ok')}>{valor}</td>
                      <AbrirLinha href={href} rotulo={rotulo} className="hidden @3xl:table-cell" />
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
      {paginado.itens.some((l) => textoDaCompetencia(l)) && <p className="mt-2 text-xs text-muted">{EXPLICACAO_COMPETENCIA}</p>}
      <Paginacao {...paginado} href={(n) => link({ pagina: String(n) })} />
    </>
  )
}

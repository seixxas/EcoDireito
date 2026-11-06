import type { Metadata } from 'next'
import { LinkRapido } from '@/components/ui/link-rapido'
import { SituacaoDaNota } from '@/components/financeiro/situacao-nota'
import { Abas, type Aba } from '@/components/ui/abas'
import { Busca } from '@/components/ui/busca'
import { Card } from '@/components/ui/card'
import { Vazio } from '@/components/ui/expansivel'
import { classeBotao } from '@/components/ui/form'
import { PageHeader } from '@/components/ui/page-header'
import { Paginacao } from '@/components/ui/paginacao'
import { SegmentedLinks } from '@/components/ui/segmented-links'
import { listarNotas, obterNota } from '@/data/financeiro'
import { listarParcelasLiberadas } from '@/data/processos'
import { exigirArea } from '@/data/sessao'
import {
  ABAS_DO_CICLO,
  abaUsaMes,
  ehAbaDoCiclo,
  FAIXAS_DE_ATRASO,
  fraseDoCiclo,
  naFaixa,
  notasPorAba,
  ordenarAtrasadas,
  ORDENS_DAS_ATRASADAS,
  primeiraAbaComItens,
  valorNaAba,
  type AbaDoCiclo,
} from '@/domain/financeiro/ciclo'
import { situacaoNota } from '@/domain/financeiro/notas'
import { combina } from '@/lib/buscar'
import { mesDe } from '@/lib/datas'
import { somar } from '@/lib/dinheiro'
import { brl, contar, formatarMes } from '@/lib/formatar'
import { paginar } from '@/lib/paginar'
import { pode } from '@/lib/permissoes'
import { DetalheDaNota, type AcaoDaNota } from './_components/detalhe-da-nota'
import { NavegacaoMes, TODOS_OS_MESES } from './_components/navegacao-mes'
import { PainelLateral } from './_components/painel-lateral'
import { TabelaAFaturar, TabelaEmAberto, TabelaRecebidas, TabelaTodas } from './_components/tabelas-do-ciclo'

export const metadata: Metadata = { title: 'Faturamento' }

type Filtros = { aba?: string; mes?: string; q?: string; faixa?: string; ordem?: string; pagina?: string; nota?: string; acao?: string }

const FUNDOS: Record<AbaDoCiclo, NonNullable<Aba['fundo']>> = {
  'a-faturar': 'verde',
  'a-vencer': 'verde',
  hoje: 'amarelo',
  atrasadas: 'vermelho',
  recebidas: 'neutro',
  todas: 'neutro',
}

const VAZIO: Record<AbaDoCiclo, string> = {
  'a-faturar': 'Nenhuma parcela para faturar',
  'a-vencer': 'Nenhuma nota a vencer',
  hoje: 'Nenhuma nota vence hoje',
  atrasadas: 'Nenhuma nota atrasada',
  recebidas: 'Nenhuma nota recebida',
  todas: 'Nenhuma nota',
}

export default async function PaginaFaturamento({ searchParams }: { searchParams: Promise<Filtros> }) {
  const [filtros, { hoje: dia, meses, notas }, parcelas, usuario] = await Promise.all([searchParams, listarNotas(), listarParcelasLiberadas(), exigirArea('financeiro')])
  const editar = pode(usuario.papel, 'financeiro', 'editar')
  const atual = mesDe(dia)
  const abaDaUrl = ehAbaDoCiclo(filtros.aba) ? filtros.aba : undefined
  // O mês só vale nas abas que têm o seletor; nas outras, Recebidas e Todas contam o mês atual.
  const mes = abaDaUrl && abaUsaMes(abaDaUrl) && (filtros.mes === TODOS_OS_MESES || meses.includes(filtros.mes ?? '')) ? filtros.mes! : atual
  const todosOsMeses = mes === TODOS_OS_MESES
  const q = filtros.q?.trim() || undefined
  const faixa = FAIXAS_DE_ATRASO.find((f) => f.id === filtros.faixa)
  const ordem = filtros.ordem === 'saldo' ? 'saldo' : 'atraso'

  // A busca vale para as abas, as contagens e a frase do topo.
  const parcelasBuscadas = parcelas
    .filter(({ parcela, processo, cliente }) => combina(q, processo.empreendimento, processo.numeroSei, cliente.nome, cliente.grupo, parcela.descricao))
    .sort((a, b) => a.liberadaEm!.localeCompare(b.liberadaEm!))
  const grupos = notasPorAba(
    notas.filter(({ nota, cliente, processo }) => combina(q, cliente.nome, cliente.grupo, nota.numero, nota.descricao, processo?.empreendimento)),
    dia,
    todosOsMeses ? undefined : mes,
  )
  const quantidades = {
    'a-faturar': parcelasBuscadas.length,
    'a-vencer': grupos['a-vencer'].length,
    hoje: grupos.hoje.length,
    atrasadas: grupos.atrasadas.length,
    recebidas: grupos.recebidas.length,
    todas: grupos.todas.length,
  }
  const aba = abaDaUrl ?? primeiraAbaComItens(quantidades)

  /** Link com os filtros de agora trocando só o que vier em `novos`. A aba vai sempre na URL: ela não pode mudar sozinha depois de um recebimento. */
  const link = (novos: Filtros) => {
    const f = { aba, mes, q, faixa: faixa?.id, ordem, ...novos }
    const destino = f.aba as AbaDoCiclo
    const params = new URLSearchParams({ aba: destino })
    if (abaUsaMes(destino) && f.mes !== atual) params.set('mes', f.mes)
    if (f.q) params.set('q', f.q)
    if (destino === 'atrasadas' && f.faixa) params.set('faixa', f.faixa)
    if (destino === 'atrasadas' && f.ordem === 'saldo') params.set('ordem', f.ordem)
    if (f.pagina && f.pagina !== '1') params.set('pagina', f.pagina)
    if (f.nota) params.set('nota', f.nota)
    if (f.nota && f.acao) params.set('acao', f.acao)
    return `/financeiro?${params}`
  }

  const atrasadasNoFiltro = ordenarAtrasadas(faixa ? grupos.atrasadas.filter(({ nota }) => naFaixa(nota, faixa, dia)) : grupos.atrasadas, ordem, dia)
  const paginaDeParcelas = paginar(parcelasBuscadas, filtros.pagina)
  const paginaDeNotas = paginar(aba === 'atrasadas' ? atrasadasNoFiltro : aba === 'a-faturar' ? [] : grupos[aba], filtros.pagina)
  const paginado = aba === 'a-faturar' ? paginaDeParcelas : paginaDeNotas

  const pagina = String(paginado.pagina)
  const linkDaNota = (id: string, acao?: AcaoDaNota) => link({ pagina, nota: id, acao })
  const painel = filtros.nota ? await obterNota(filtros.nota) : undefined
  const acao = filtros.acao === 'receber' || filtros.acao === 'cobrar' ? filtros.acao : undefined
  const tabela = { itens: paginaDeNotas.itens, dia, notaAberta: painel?.nota.id, linkDaNota }
  const periodo = todosOsMeses ? 'em todos os meses' : `em ${formatarMes(mes)}`
  const contarItens = (id: AbaDoCiclo, n: number) => (id === 'a-faturar' ? contar(n, 'parcela', 'parcelas') : contar(n, 'nota', 'notas'))

  return (
    <>
      <PageHeader
        titulo="Faturamento"
        resumo={fraseDoCiclo(quantidades, q)}
        acoes={
          editar && (
            <LinkRapido href="/financeiro/notas/nova" className={classeBotao('primario', 'min-h-14 text-[1.25rem]')}>
              + Registrar nota
            </LinkRapido>
          )
        }
      />

      <p className="mb-3 text-base font-semibold text-ink">Mostrar</p>
      <Abas
        ativa={aba}
        abas={(Object.keys(ABAS_DO_CICLO) as AbaDoCiclo[]).map((id) => ({
          valor: id,
          rotulo: ABAS_DO_CICLO[id],
          href: link({ aba: id }),
          legenda: `${contarItens(id, quantidades[id])}${id === aba ? ' · selecionado' : ''}`,
          detalhe: brl(id === 'a-faturar' ? somar(parcelasBuscadas.map(({ parcela }) => parcela.valor)) : somar(grupos[id].map(({ nota }) => valorNaAba(id, nota, dia)))),
          fundo: id === 'atrasadas' && !quantidades.atrasadas ? 'neutro' : FUNDOS[id],
          alerta: id === 'atrasadas' && quantidades.atrasadas > 0,
        }))}
      />

      <div className="mb-6 flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
        <Busca
          valor={q}
          placeholder="Cliente, grupo, NF ou serviço"
          manter={{
            aba,
            mes: abaUsaMes(aba) && mes !== atual ? mes : undefined,
            faixa: aba === 'atrasadas' ? faixa?.id : undefined,
            ordem: aba === 'atrasadas' && ordem === 'saldo' ? ordem : undefined,
          }}
          limpar={link({ q: undefined })}
          className="min-w-60"
        />
        <LinkRapido href="/financeiro/faturado-recebido" className="link inline-flex min-h-12 items-center text-base">
          Ver faturado × recebido
        </LinkRapido>
      </div>

      {abaUsaMes(aba) && (
        <div className="mb-6">
          <NavegacaoMes mes={mes} meses={meses} href={(m) => link({ mes: m })} todos />
        </div>
      )}

      {aba === 'atrasadas' && (
        <div className="mb-6 flex flex-wrap items-end justify-between gap-x-6 gap-y-4">
          <SegmentedLinks
            rotulo="Tempo de atraso"
            ativo={faixa?.id ?? 'todas'}
            opcoes={[
              { valor: 'todas', rotulo: 'Todas', href: link({ faixa: undefined }), contagem: quantidades.atrasadas },
              ...FAIXAS_DE_ATRASO.map((f) => ({
                valor: f.id,
                rotulo: f.rotulo,
                href: link({ faixa: f.id }),
                contagem: grupos.atrasadas.filter(({ nota }) => naFaixa(nota, f, dia)).length,
              })),
            ]}
          />
          <SegmentedLinks
            rotulo="Ordenar por"
            ativo={ordem}
            opcoes={Object.entries(ORDENS_DAS_ATRASADAS).map(([valor, rotulo]) => ({ valor, rotulo, href: link({ ordem: valor }) }))}
          />
        </div>
      )}

      <Card flush titulo={`${ABAS_DO_CICLO[aba]}${faixa && aba === 'atrasadas' ? `, ${faixa.rotulo.toLowerCase()}` : ''} — ${contarItens(aba, paginado.total)}`}>
        {paginado.total === 0 ? null : aba === 'a-faturar' ? (
          <TabelaAFaturar itens={paginaDeParcelas.itens} editar={editar} />
        ) : aba === 'recebidas' ? (
          <TabelaRecebidas {...tabela} />
        ) : aba === 'todas' ? (
          <TabelaTodas {...tabela} />
        ) : (
          <TabelaEmAberto {...tabela} editar={editar} comAtraso={aba === 'atrasadas'} />
        )}
        {paginado.total === 0 && (
          <Vazio>
            {VAZIO[aba]}
            {faixa && aba === 'atrasadas' && ' nesta faixa'}
            {q && ` com “${q}”`}
            {abaUsaMes(aba) && ` ${periodo}`}.
            {q && abaUsaMes(aba) && !todosOsMeses && (
              <>
                {' '}
                <LinkRapido href={link({ mes: TODOS_OS_MESES })} className="link">
                  Buscar em todos os meses
                </LinkRapido>
              </>
            )}
          </Vazio>
        )}
      </Card>
      <Paginacao {...paginado} href={(n) => link({ pagina: String(n) })} />

      {painel && (
        <PainelLateral
          key={`${painel.nota.id}:${acao ?? ''}`}
          titulo={`NF ${painel.nota.numero}`}
          subtitulo={
            <span className="inline-flex flex-wrap items-center gap-x-3 gap-y-1">
              {painel.cliente.nome} <SituacaoDaNota situacao={situacaoNota(painel.nota, dia)} />
            </span>
          }
          fechar={link({ pagina })}
        >
          <DetalheDaNota dados={painel} editar={editar} acao={acao} />
        </PainelLateral>
      )}
    </>
  )
}

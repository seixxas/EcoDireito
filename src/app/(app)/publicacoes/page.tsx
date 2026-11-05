import { ExternalLink } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { AbasDoDia } from '@/components/layout/abas-do-dia'
import { Badge } from '@/components/ui/badge'
import { Busca } from '@/components/ui/busca'
import { Expansivel, Vazio } from '@/components/ui/expansivel'
import { Linha, Lista } from '@/components/ui/lista'
import { PageHeader } from '@/components/ui/page-header'
import { Paginacao } from '@/components/ui/paginacao'
import { Secao } from '@/components/ui/secao'
import { SegmentedLinks } from '@/components/ui/segmented-links'
import { Situacao } from '@/components/ui/situacao'
import { hoje } from '@/data/hoje'
import { listarPublicacoes, type PublicacaoNaCaixa } from '@/data/publicacoes'
import { exigirArea } from '@/data/sessao'
import { diaUtilAnterior, ehDiaUtil } from '@/domain/feriados'
import { EVENTOS } from '@/domain/processos'
import { combina } from '@/lib/buscar'
import { cn } from '@/lib/cn'
import type { DataISO } from '@/lib/datas'
import { contar, formatarDataNaLista, formatarDiaEData } from '@/lib/formatar'
import { paginar } from '@/lib/paginar'
import { pode } from '@/lib/permissoes'
import { AcoesPublicacao } from './_components/acoes-publicacao'
import { BuscaEdicao } from './_components/busca-edicao'

export const metadata: Metadata = { title: 'Diário Oficial' }

const ABAS = { nova: 'Para revisar', confirmada: 'Lançados', descartada: 'Ignorados' } as const
type Aba = keyof typeof ABAS

const HORARIO = new Intl.DateTimeFormat('pt-BR', { timeZone: 'America/Sao_Paulo', day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })

function endereco(aba: Aba, q?: string, pagina = 1) {
  const busca = new URLSearchParams()
  if (aba !== 'nova') busca.set('aba', aba)
  if (q) busca.set('q', q)
  if (pagina > 1) busca.set('pagina', String(pagina))
  return busca.size ? `/publicacoes?${busca}` : '/publicacoes'
}

const linkDoProcesso = (processo: NonNullable<PublicacaoNaCaixa['processo']>) => (
  <Link href={`/processos/${processo.id}`} className="link">
    {processo.empreendimento}
  </Link>
)

/** Por que o ato está na caixa: como o robô o ligou a um processo ou cliente. */
function PorQue({ ato, vinculo, processo }: PublicacaoNaCaixa) {
  if (processo && vinculo.comoAchou === 'simproc') return <>Achado pelo nº SIMPROC do processo {linkDoProcesso(processo)}, escrito no texto do ato.</>
  if (processo) return <>Achado pelo nº SEI do processo {linkDoProcesso(processo)}.</>
  return (
    <>
      Achado pelo CNPJ do cliente, escrito no texto do ato. O processo deste ato{' '}
      {ato.processo && (
        <>
          (SEI <span className="whitespace-nowrap">{ato.processo}</span>){' '}
        </>
      )}
      ainda não está cadastrado.
    </>
  )
}

/** O que lançar faz: a etapa marcada e os prazos que ela abre. */
function AoLancar({ evento, prazosSugeridos, processo, dia }: PublicacaoNaCaixa & { dia: DataISO }) {
  if (!evento) {
    return processo ? (
      <>Este tipo de ato não marca etapa: marcar como visto registra só que ele é nosso.</>
    ) : (
      <>Este tipo de ato não marca etapa: ao cadastrar o processo, ele fica registrado como visto.</>
    )
  }
  return (
    <>
      Ao lançar: marca a etapa “{EVENTOS[evento].nome}”
      {prazosSugeridos.length > 0 && (prazosSugeridos.length === 1 ? ' e abre o prazo ' : ' e abre os prazos ')}
      {prazosSugeridos.map((prazo, i) => (
        <span key={prazo.titulo} title={prazo.explicacao}>
          {i > 0 && (i === prazosSugeridos.length - 1 ? ' e ' : ', ')}“{prazo.titulo}” até{' '}
          <span className="tabular-nums text-ink">{formatarDataNaLista(prazo.vencimento, dia)}</span>
        </span>
      ))}
      .
    </>
  )
}

/** Aviso depois de cadastrar um processo a partir de um ato (`?lancado=<id do ato>`). Ponto + texto, como `Situacao`, mas quebrando linha. */
function AvisoDoCadastro({ item }: { item: PublicacaoNaCaixa }) {
  const lancado = item.ato.status !== 'nova'
  return (
    <p className={cn('-mt-3 mb-5 flex items-start gap-1.5 text-sm', lancado ? 'text-ok' : 'text-warn')}>
      <span className={cn('mt-1.5 size-2 shrink-0 rounded-full', lancado ? 'bg-ok' : 'bg-accent')} />
      <span>
        {lancado ? `Processo cadastrado e ato ${item.evento ? 'lançado' : 'registrado como visto'}. ` : 'Processo cadastrado com outro nº SEI: o ato não foi lançado e continua aqui para revisar.'}
        {lancado && item.processo && (
          <Link href={`/processos/${item.processo.id}`} className="link">
            Abrir o processo
          </Link>
        )}
      </span>
    </p>
  )
}

export default async function PaginaPublicacoes({ searchParams }: { searchParams: Promise<{ aba?: string; q?: string; pagina?: string; lancado?: string }> }) {
  const { aba: pedida, q: buscado, pagina, lancado } = await searchParams
  const aba: Aba = pedida && pedida in ABAS ? (pedida as Aba) : 'nova'
  const q = String(buscado ?? '').trim() || undefined
  const [{ edicao, itens }, usuario, dia] = await Promise.all([listarPublicacoes(), exigirArea('prazos'), hoje()])
  const editar = pode(usuario.papel, 'prazos', 'editar')
  const achados = itens.filter(({ ato, cliente, processo }) =>
    combina(q, ato.texto, ato.serie, ato.processo, cliente.nome, cliente.grupo, processo?.empreendimento, processo?.numeroSei),
  )
  const daAba = achados.filter((item) => item.ato.status === aba)
  // Na caixa de entrada, os atos de processos acompanhados vêm antes dos que ainda não têm processo (a página corta, os grupos separam).
  if (aba === 'nova') daAba.sort((a, b) => Number(!a.processo) - Number(!b.processo))
  const lista = paginar(daAba, pagina)
  const novas = itens.filter((item) => item.ato.status === 'nova').length
  const cadastrado = lancado ? itens.find((item) => item.ato.id === lancado) : undefined

  const lida = edicao.processadaEm ? ` (lida em ${HORARIO.format(new Date(edicao.processadaEm)).replace(', ', ' às ')})` : ''
  const paraRevisar = novas ? `${contar(novas, 'ato', 'atos')} para revisar` : 'nada para revisar'

  const linha = (item: PublicacaoNaCaixa) => {
    const { ato, evento, cliente, processo } = item
    return (
      // No celular a data vai para a linha de detalhes e as ações descem para baixo do texto.
      <Linha key={ato.id} className="flex-wrap items-start gap-y-2 sm:flex-nowrap">
        <span className="hidden w-24 shrink-0 tabular-nums text-muted sm:block">{formatarDataNaLista(ato.data, dia)}</span>
        <div className="min-w-0 basis-full sm:basis-auto sm:flex-1">
          <p className="flex flex-wrap items-baseline gap-x-2">
            <Badge>{ato.serie}</Badge>
            <span className="font-medium text-ink">{cliente.nome}</span>
          </p>
          <p className="mt-1 text-sm text-muted">
            <PorQue {...item} />
          </p>
          {ato.status === 'nova' && (
            <p className="mt-0.5 text-sm text-muted">
              <AoLancar {...item} dia={dia} />
            </p>
          )}
          {ato.status === 'confirmada' && evento && <p className="mt-0.5 text-sm text-muted">Marcou a etapa “{EVENTOS[evento].nome}”.</p>}
          <div className="mt-0.5 flex flex-wrap items-baseline gap-x-3 text-xs text-muted">
            <span className="tabular-nums sm:hidden">{formatarDataNaLista(ato.data, dia)}</span>
            <span>{ato.unidade}</span>
            {ato.link && (
              <a href={ato.link} target="_blank" rel="noopener noreferrer" className="link inline-flex items-center gap-1">
                Abrir no Diário <ExternalLink className="size-3" />
              </a>
            )}
            <Expansivel resumo={<span className="text-xs">texto do ato</span>} className="open:basis-full">
              <p className="max-h-72 overflow-y-auto whitespace-pre-line rounded-md bg-rail p-3 text-sm leading-relaxed text-muted">{ato.texto}</p>
            </Expansivel>
          </div>
        </div>
        <div className="shrink-0">
          {ato.status === 'confirmada' && (evento ? <Situacao tom="ok">Lançado</Situacao> : <Situacao>Visto</Situacao>)}
          {ato.status === 'descartada' && (
            <>
              <Situacao>Ignorado</Situacao>
              <p className="max-w-56 text-xs text-muted">{ato.motivo}</p>
            </>
          )}
          {ato.status === 'nova' &&
            (editar ? (
              <AcoesPublicacao id={ato.id} temProcesso={Boolean(processo)} marcaEtapa={Boolean(evento)} />
            ) : (
              <Situacao tom="warn">Esperando revisão</Situacao>
            ))}
        </div>
      </Linha>
    )
  }

  const grupos =
    aba === 'nova'
      ? [
          { titulo: 'De processos que já acompanhamos', itens: lista.itens.filter((item) => item.processo) },
          { titulo: 'De clientes, mas o processo ainda não está cadastrado', itens: lista.itens.filter((item) => !item.processo) },
        ]
      : [{ titulo: undefined, itens: lista.itens }]

  return (
    <>
      <AbasDoDia ativa="diario" />
      <PageHeader
        titulo="Diário Oficial"
        resumo={`Edição de ${formatarDiaEData(edicao.data)}${lida}: ${edicao.totalAtos.toLocaleString('pt-BR')} atos, ${edicao.atosSvma} da Secretaria do Verde e ${paraRevisar}.`}
        acoes={editar && <BuscaEdicao dia={ehDiaUtil(dia) ? dia : diaUtilAnterior(dia)} />}
      />
      {edicao.erro && (
        <p className="-mt-3 mb-5">
          <Situacao tom="warn">{edicao.erro}</Situacao>
        </p>
      )}
      {cadastrado && <AvisoDoCadastro item={cadastrado} />}

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <SegmentedLinks
          ativo={aba}
          opcoes={Object.entries(ABAS).map(([valor, rotulo]) => ({
            valor,
            rotulo,
            href: endereco(valor as Aba, q),
            contagem: achados.filter((item) => item.ato.status === valor).length,
          }))}
        />
        <Busca
          valor={q}
          placeholder="Empresa, nº SEI ou texto do ato"
          manter={{ aba: aba === 'nova' ? undefined : aba }}
          limpar={endereco(aba)}
          className="min-w-60"
        />
      </div>
      {aba === 'nova' && (
        <p className="mb-6 text-sm text-muted">
          O robô lê o Diário Oficial e traz os atos que parecem ser dos nossos clientes. Para cada um, decida: lançar no processo (marca a etapa e conta o
          prazo) ou ignorar.
        </p>
      )}

      {grupos.map(
        (grupo) =>
          grupo.itens.length > 0 &&
          (grupo.titulo ? (
            <Secao key={grupo.titulo} titulo={grupo.titulo}>
              <Lista>{grupo.itens.map(linha)}</Lista>
            </Secao>
          ) : (
            <Lista key="lista">{grupo.itens.map(linha)}</Lista>
          )),
      )}
      {lista.total === 0 && <Vazio>{q ? 'Nenhum ato com essa busca.' : 'Nada aqui.'}</Vazio>}
      <Paginacao {...lista} href={(n) => endereco(aba, q, n)} />
    </>
  )
}

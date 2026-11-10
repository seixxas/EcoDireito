import type { Metadata } from 'next'
import { LinkRapido } from '@/components/ui/link-rapido'
import { Badge } from '@/components/ui/badge'
import { Busca } from '@/components/ui/busca'
import { Vazio } from '@/components/ui/expansivel'
import { classeBotao } from '@/components/ui/form'
import { PageHeader } from '@/components/ui/page-header'
import { Paginacao } from '@/components/ui/paginacao'
import { SegmentedLinks } from '@/components/ui/segmented-links'
import { Situacao } from '@/components/ui/situacao'
import { Item, Zona, type TomZona } from '@/components/ui/zona'
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
  <LinkRapido href={`/projetos/${processo.id}`} className="link">
    {processo.empreendimento}
  </LinkRapido>
)

/** Por que o ato está na caixa: como o robô o ligou a um processo ou cliente. */
function PorQue({ ato, vinculo, processo }: PublicacaoNaCaixa) {
  if (processo && vinculo.comoAchou === 'simproc') return <>Achado pelo nº SIMPROC do projeto {linkDoProcesso(processo)}, escrito no texto do ato.</>
  if (processo) return <>Achado pelo nº SEI do projeto {linkDoProcesso(processo)}.</>
  return (
    <>
      Achado pelo CNPJ do cliente, escrito no texto do ato. O projeto deste ato{' '}
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
      <>Este tipo de ato não marca etapa: ao cadastrar o projeto, ele fica registrado como visto.</>
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

/** Aviso depois de cadastrar um processo a partir de um ato (`?lancado=<id do ato>`). */
function AvisoDoCadastro({ item }: { item: PublicacaoNaCaixa }) {
  const lancado = item.ato.status !== 'nova'
  return (
    <div className={cn('mb-3 rounded-md border px-3 py-2 text-sm font-medium', lancado ? 'border-brand-700 bg-brand-100 text-brand-700' : 'border-warn bg-warn-soft text-warn')}>
      <p>{lancado ? `Projeto cadastrado e ato ${item.evento ? 'lançado' : 'registrado como visto'}.` : 'Projeto cadastrado com outro nº SEI: o ato não foi lançado e continua aqui para revisar.'}</p>
      {lancado && item.processo && (
        <LinkRapido href={`/projetos/${item.processo.id}`} className={classeBotao('secundario', 'mt-2')}>
          Abrir o projeto
        </LinkRapido>
      )}
    </div>
  )
}

/** O botão fica com os outros, à direita, mas o texto abre embaixo do ato, onde há largura. */
function VerOTexto() {
  return (
    <details className="group/texto">
      <summary className={classeBotao('secundario', 'list-none [&::-webkit-details-marker]:hidden')}>
        <span className="group-open/texto:hidden">Ver o texto do ato</span>
        <span className="hidden group-open/texto:inline">Esconder o texto do ato</span>
      </summary>
    </details>
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
    const { ato, evento, cliente, processo, prazosSugeridos } = item
    const data = formatarDataNaLista(ato.data, dia)
    return (
      <Item
        key={ato.id}
        className="group/ato"
        etiqueta={
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <Badge tom="info">{ato.serie}</Badge>
            <span className="text-xs text-muted">{data}</span>
            {ato.status === 'confirmada' && (evento ? <Situacao tom="ok">Lançado</Situacao> : <Situacao>Visto</Situacao>)}
            {ato.status === 'descartada' && <Situacao>Ignorado</Situacao>}
          </div>
        }
        titulo={cliente.nome}
        detalhe={
          <div className="space-y-0.5">
            <p>
              <PorQue {...item} />
            </p>
            {ato.status === 'nova' && (
              <p>
                <AoLancar {...item} dia={dia} />
              </p>
            )}
            {ato.status === 'confirmada' && evento && <p>Marcou a etapa “{EVENTOS[evento].nome}”.</p>}
            {ato.status === 'descartada' && ato.motivo && <p className="font-medium text-ink">Motivo: {ato.motivo}</p>}
            <div className="flex flex-wrap items-center gap-x-3">
              <span>{ato.unidade}</span>
              {ato.link && (
                <a href={ato.link} target="_blank" rel="noopener noreferrer" className="link">
                  Abrir no Diário
                </a>
              )}
            </div>
            <p className="mt-1! hidden max-h-72 overflow-y-auto whitespace-pre-line rounded-md bg-rail p-2 leading-relaxed group-has-[details[open]]/ato:block">{ato.texto}</p>
          </div>
        }
        fim={
          ato.status === 'nova' && editar ? (
            <AcoesPublicacao
              id={ato.id}
              temProcesso={Boolean(processo)}
              marcaEtapa={Boolean(evento)}
              oQue={`${ato.serie} · ${cliente.nome} · ${data}`}
              prazos={prazosSugeridos.map((prazo) => prazo.titulo)}
              destaque
            >
              <VerOTexto />
            </AcoesPublicacao>
          ) : (
            <div className="flex flex-wrap items-center gap-1.5">
              {ato.status === 'nova' && (
                <Situacao tom="warn">Esperando revisão</Situacao>
              )}
              <VerOTexto />
            </div>
          )
        }
      />
    )
  }

  const grupos: { titulo: string; tom: TomZona; itens: PublicacaoNaCaixa[]; total: number }[] =
    aba === 'nova'
      ? [
          { titulo: 'De projetos que já acompanhamos', tom: 'diario', itens: lista.itens.filter((item) => item.processo), total: daAba.filter((item) => item.processo).length },
          {
            titulo: 'De clientes, mas o projeto ainda não está cadastrado',
            tom: 'neutra',
            itens: lista.itens.filter((item) => !item.processo),
            total: daAba.filter((item) => !item.processo).length,
          },
        ]
      : [{ titulo: ABAS[aba], tom: aba === 'confirmada' ? 'proximos' : 'apagada', itens: lista.itens, total: lista.total }]

  return (
    <>
      <PageHeader
        titulo="Diário Oficial"
        resumo={`Edição de ${formatarDiaEData(edicao.data)}${lida}: ${edicao.totalAtos.toLocaleString('pt-BR')} atos, ${edicao.atosSvma} da Secretaria do Verde e ${paraRevisar}.`}
        acoes={editar && <BuscaEdicao dia={ehDiaUtil(dia) ? dia : diaUtilAnterior(dia)} />}
      />
      {edicao.erro && (
        <p className="-mt-2 mb-3">
          <Situacao tom="warn">{edicao.erro}</Situacao>
        </p>
      )}
      {cadastrado && <AvisoDoCadastro item={cadastrado} />}

      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
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
        <p className="mb-3 rounded-md bg-painel px-3 py-1.5 text-sm">
          O robô lê o Diário Oficial e traz os atos que parecem ser dos nossos clientes. Para cada um, decida: <b className="font-semibold">lançar no projeto</b> (marca a etapa e conta o prazo) ou{' '}
          <b className="font-semibold">ignorar</b>.
        </p>
      )}

      {grupos.map(
        (grupo) =>
          grupo.itens.length > 0 && (
            <Zona key={grupo.titulo} tom={grupo.tom} titulo={grupo.titulo} detalhe={contar(grupo.total, 'ato', 'atos')}>
              {grupo.itens.map(linha)}
            </Zona>
          ),
      )}
      {lista.total === 0 && <Vazio>{q ? 'Nenhum ato com essa busca.' : 'Nada aqui.'}</Vazio>}
      <Paginacao {...lista} href={(n) => endereco(aba, q, n)} />
    </>
  )
}

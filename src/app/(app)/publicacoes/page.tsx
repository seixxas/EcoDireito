import { ExternalLink } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Expansivel, Vazio } from '@/components/ui/expansivel'
import { Linha, Lista } from '@/components/ui/lista'
import { PageHeader } from '@/components/ui/page-header'
import { SegmentedLinks } from '@/components/ui/segmented-links'
import { Situacao } from '@/components/ui/situacao'
import { hoje } from '@/data/hoje'
import { listarPublicacoes } from '@/data/publicacoes'
import { exigirArea } from '@/data/sessao'
import { diaUtilAnterior, ehDiaUtil } from '@/domain/feriados'
import { EVENTOS } from '@/domain/processos'
import { COMO_ACHOU } from '@/domain/publicacoes'
import { formatarDataNaLista, formatarDiaEData } from '@/lib/formatar'
import { pode } from '@/lib/permissoes'
import { AcoesPublicacao } from './_components/acoes-publicacao'
import { BuscaEdicao } from './_components/busca-edicao'

export const metadata: Metadata = { title: 'Diário Oficial' }

const ABAS = { nova: 'Para revisar', confirmada: 'Confirmadas', descartada: 'Descartadas' } as const
type Aba = keyof typeof ABAS

const HORARIO = new Intl.DateTimeFormat('pt-BR', { timeZone: 'America/Sao_Paulo', day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })

export default async function PaginaPublicacoes({ searchParams }: { searchParams: Promise<{ aba?: string }> }) {
  const { aba: pedida } = await searchParams
  const aba: Aba = pedida && pedida in ABAS ? (pedida as Aba) : 'nova'
  const [{ edicao, itens }, usuario, dia] = await Promise.all([listarPublicacoes(), exigirArea('prazos'), hoje()])
  const editar = pode(usuario.papel, 'prazos', 'editar')
  const lista = itens.filter((item) => item.ato.status === aba)
  const novas = itens.filter((item) => item.ato.status === 'nova').length

  const lida = edicao.processadaEm ? ` (lida em ${HORARIO.format(new Date(edicao.processadaEm)).replace(', ', ' às ')})` : ''
  const paraRevisar = novas === 0 ? 'nada para revisar' : novas === 1 ? '1 ato para revisar' : `${novas} atos para revisar`

  return (
    <>
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

      <div className="mb-6">
        <SegmentedLinks
          ativo={aba}
          opcoes={Object.entries(ABAS).map(([valor, rotulo]) => ({
            valor,
            rotulo,
            href: valor === 'nova' ? '/publicacoes' : `/publicacoes?aba=${valor}`,
            contagem: itens.filter((item) => item.ato.status === valor).length,
          }))}
        />
      </div>

      <Lista>
        {lista.map(({ ato, vinculo, evento, cliente, processo, prazosSugeridos }) => (
          // No celular a data vai para a linha de detalhes e as ações descem para baixo do texto.
          <Linha key={ato.id} className="flex-wrap items-start gap-y-2 sm:flex-nowrap">
            <span className="hidden w-24 shrink-0 tabular-nums text-muted sm:block">{formatarDataNaLista(ato.data, dia)}</span>
            <div className="min-w-0 basis-full sm:basis-auto sm:flex-1">
              <p className="flex flex-wrap items-baseline gap-x-2">
                <Badge>{ato.serie}</Badge>
                <span className="font-medium text-ink">{cliente.nome}</span>
                {processo ? (
                  <Link href={`/processos/${processo.id}`} className="text-brand-700 hover:underline">
                    {processo.empreendimento}
                  </Link>
                ) : (
                  <span className="text-warn">processo não cadastrado (SEI {ato.processo})</span>
                )}
              </p>
              {evento && (
                <p className="mt-0.5 text-sm text-muted">
                  Ao confirmar: {EVENTOS[evento].nome}
                  {prazosSugeridos.map((prazo) => (
                    <span key={prazo.titulo} title={prazo.explicacao}>
                      {' · '}
                      {prazo.titulo} até <span className="tabular-nums text-ink">{formatarDataNaLista(prazo.vencimento, dia)}</span>
                    </span>
                  ))}
                </p>
              )}
              <div className="mt-0.5 flex flex-wrap items-baseline gap-x-3 text-xs text-muted">
                <span className="tabular-nums sm:hidden">{formatarDataNaLista(ato.data, dia)}</span>
                <span>Achado pelo {COMO_ACHOU[vinculo.comoAchou]}</span>
                <span>{ato.unidade}</span>
                {ato.link && (
                  <a href={ato.link} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-brand-700 hover:underline">
                    Abrir no Diário <ExternalLink className="size-3" />
                  </a>
                )}
                <Expansivel resumo={<span className="text-xs">texto do ato</span>} className="open:basis-full">
                  <p className="max-h-72 overflow-y-auto whitespace-pre-line rounded-md bg-rail p-3 text-sm leading-relaxed text-muted">{ato.texto}</p>
                </Expansivel>
              </div>
            </div>
            <div className="shrink-0">
              {ato.status === 'confirmada' && <Situacao tom="ok">Confirmada</Situacao>}
              {ato.status === 'descartada' && (
                <>
                  <Situacao>Descartada</Situacao>
                  <p className="max-w-56 text-xs text-muted">{ato.motivo}</p>
                </>
              )}
              {ato.status === 'nova' &&
                (editar ? (
                  <AcoesPublicacao id={ato.id} temProcesso={Boolean(processo)} />
                ) : (
                  <Situacao tom="warn">Esperando revisão</Situacao>
                ))}
            </div>
          </Linha>
        ))}
      </Lista>
      {lista.length === 0 && <Vazio>Nada aqui.</Vazio>}
    </>
  )
}

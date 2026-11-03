import { CircleCheck, Search } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { PageHeader } from '@/components/ui/page-header'
import { SegmentedLinks } from '@/components/ui/segmented-links'
import { Stat } from '@/components/ui/stat'
import { listarPublicacoes } from '@/data/publicacoes'
import { exigirArea } from '@/data/sessao'
import { TIPOS_PRAZO } from '@/domain/prazos'
import { EVENTOS } from '@/domain/processos'
import { COMO_ACHOU } from '@/domain/publicacoes'
import { formatarData, formatarDiaEData } from '@/lib/formatar'
import { pode } from '@/lib/permissoes'
import { AcoesPublicacao } from './_components/acoes-publicacao'

export const metadata: Metadata = { title: 'Diário Oficial' }

const ABAS = { nova: 'Para revisar', confirmada: 'Confirmadas', descartada: 'Descartadas' } as const
type Aba = keyof typeof ABAS

export default async function PaginaPublicacoes({ searchParams }: { searchParams: Promise<{ aba?: string }> }) {
  const { aba: pedida } = await searchParams
  const aba: Aba = pedida && pedida in ABAS ? (pedida as Aba) : 'nova'
  const [{ edicao, itens }, usuario] = await Promise.all([listarPublicacoes(), exigirArea('prazos')])
  const editar = pode(usuario.papel, 'prazos', 'editar')
  const lista = itens.filter((item) => item.ato.status === aba)
  const novas = itens.filter((item) => item.ato.status === 'nova')

  return (
    <>
      <PageHeader
        titulo="Diário Oficial"
        descricao="Todo dia útil, às 6h, o robô baixa a edição do Diário Oficial da Cidade, separa os atos da Secretaria do Verde e procura os processos e clientes da Eco Direito. Nada vira prazo sem alguém confirmar."
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat rotulo="Edição lida" valor={formatarDiaEData(edicao.data)} detalhe="processada às 06:02" tom="brand" />
        <Stat rotulo="Atos na edição" valor={edicao.totalAtos.toLocaleString('pt-BR')} detalhe="todos os órgãos da Prefeitura" />
        <Stat rotulo="Da Secretaria do Verde" valor={edicao.atosSvma} detalhe="lidos um a um pelo robô" />
        <Stat rotulo="Com clientes da Eco Direito" valor={novas.length} detalhe="esperando revisão" tom={novas.length ? 'warn' : 'ok'} />
      </div>

      <div className="mb-4">
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

      <div className="space-y-4">
        {lista.map(({ ato, vinculo, evento, cliente, processo, prazosSugeridos }) => (
          <article key={ato.id} className="rounded-2xl border border-line bg-surface p-5">
            <div className="flex flex-wrap items-center gap-2">
              <Badge tom="brand">{ato.serie}</Badge>
              <span className="text-sm text-muted">
                {formatarData(ato.data)} · {ato.unidade} · documento {ato.documento}
              </span>
              <Badge tom="info" className="ml-auto">
                <Search className="size-3" /> Achado pelo {COMO_ACHOU[vinculo.comoAchou]}
              </Badge>
            </div>

            <div className="mt-3 grid gap-5 lg:grid-cols-5">
              <div className="lg:col-span-3">
                <p className="text-sm">
                  <span className="font-semibold">{cliente.nome}</span>
                  {processo ? (
                    <>
                      {' · '}
                      <Link href={`/processos/${processo.id}`} className="font-medium text-brand-700 hover:underline">
                        {processo.empreendimento}
                      </Link>
                    </>
                  ) : (
                    <span className="text-warn"> · processo ainda não cadastrado (SEI {ato.processo})</span>
                  )}
                </p>
                <p className="mt-2 rounded-lg bg-canvas p-3 text-sm leading-relaxed text-muted">{ato.texto}</p>
              </div>

              <div className="lg:col-span-2">
                {evento && (
                  <>
                    <p className="text-xs font-semibold uppercase tracking-wide text-subtle">Ao confirmar</p>
                    <p className="mt-1 flex items-center gap-1.5 text-sm font-medium">
                      <CircleCheck className="size-4 text-ok" /> {EVENTOS[evento].nome}
                    </p>
                    <ul className="mt-2 space-y-2">
                      {prazosSugeridos.map((prazo) => (
                        <li key={prazo.titulo} className="rounded-lg border border-line p-2.5 text-sm">
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-medium">{prazo.titulo}</span>
                            <Badge tom={prazo.tipo === 'expectativa' ? 'info' : 'warn'}>{formatarData(prazo.vencimento)}</Badge>
                          </div>
                          <p className="mt-0.5 text-xs text-subtle">
                            {TIPOS_PRAZO[prazo.tipo]} · {prazo.explicacao}
                          </p>
                        </li>
                      ))}
                    </ul>
                  </>
                )}
                <div className="mt-3">
                  {ato.status === 'confirmada' && <p className="text-sm text-muted">Confirmada pela equipe.</p>}
                  {ato.status === 'descartada' && <p className="text-sm text-muted">Descartada: {ato.motivo}.</p>}
                  {ato.status === 'nova' &&
                    (editar ? (
                      <AcoesPublicacao id={ato.id} temProcesso={Boolean(processo)} temEvento={Boolean(evento)} prazos={prazosSugeridos.length} />
                    ) : (
                      <p className="text-sm text-muted">Esperando a revisão da equipe.</p>
                    ))}
                </div>
              </div>
            </div>
          </article>
        ))}
        {lista.length === 0 && <p className="rounded-2xl border border-line bg-surface p-10 text-center text-muted">Nada aqui.</p>}
      </div>
    </>
  )
}

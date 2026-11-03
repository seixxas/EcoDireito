import type { Metadata } from 'next'
import Link from 'next/link'
import { SituacaoPrazo } from '@/components/prazos/situacao-prazo'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { PageHeader } from '@/components/ui/page-header'
import { SegmentedLinks } from '@/components/ui/segmented-links'
import { hoje } from '@/data/hoje'
import { listarPrazos, type PrazoComProcesso } from '@/data/processos'
import { TIPOS_PRAZO, estaAberto } from '@/domain/prazos'
import { diasEntre, type DataISO } from '@/lib/datas'
import { formatarData, formatarDiaEData } from '@/lib/formatar'

export const metadata: Metadata = { title: 'Prazos' }

type Regra = (prazo: PrazoComProcesso, hoje: DataISO) => boolean
const daEcoDireito: Regra = (p, h) => p.regra.tipo !== 'expectativa' && estaAberto(p, h)

const FILTROS = {
  abertos: { rotulo: 'Em aberto', regra: daEcoDireito },
  vencidos: { rotulo: 'Vencidos', regra: (p, h) => daEcoDireito(p, h) && p.vencimento < h },
  semana: { rotulo: 'Próximos 7 dias', regra: (p, h) => daEcoDireito(p, h) && p.vencimento >= h && diasEntre(h, p.vencimento) <= 7 },
  mes: { rotulo: 'Próximos 30 dias', regra: (p, h) => daEcoDireito(p, h) && p.vencimento >= h && diasEntre(h, p.vencimento) <= 30 },
  orgao: { rotulo: 'Aguardando a SVMA', regra: (p, h) => p.regra.tipo === 'expectativa' && estaAberto(p, h) },
  cumpridos: { rotulo: 'Cumpridos', regra: (p, h) => !estaAberto(p, h) },
} satisfies Record<string, { rotulo: string; regra: Regra }>

type Filtro = keyof typeof FILTROS

export default async function PaginaPrazos({ searchParams }: { searchParams: Promise<{ filtro?: string }> }) {
  const { filtro: pedido } = await searchParams
  const filtro: Filtro = pedido && pedido in FILTROS ? (pedido as Filtro) : 'abertos'
  const [dia, prazos] = await Promise.all([hoje(), listarPrazos()])
  const lista = prazos.filter((p) => FILTROS[filtro].regra(p, dia))
  if (filtro === 'cumpridos') lista.reverse()

  const opcoes = Object.entries(FILTROS).map(([valor, { rotulo, regra }]) => ({
    valor,
    rotulo,
    href: valor === 'abertos' ? '/prazos' : `/prazos?filtro=${valor}`,
    contagem: prazos.filter((p) => regra(p, dia)).length,
  }))

  return (
    <>
      <PageHeader
        titulo="Prazos"
        descricao="Todos os prazos dos processos, calculados a partir dos eventos. Prazo da Prefeitura conta em dias corridos a partir da publicação; se vencer em dia sem expediente, passa para o próximo dia útil (Lei 14.141/2006, art. 40)."
      />
      <div className="mb-4">
        <SegmentedLinks opcoes={opcoes} ativo={filtro} />
      </div>
      <Card flush>
        <table className="tabela">
          <thead>
            <tr>
              <th>Vencimento</th>
              <th>Prazo</th>
              <th>Processo</th>
              <th>Responsável</th>
              <th>Situação</th>
            </tr>
          </thead>
          <tbody>
            {lista.map((prazo) => (
              <tr key={prazo.id}>
                <td className="whitespace-nowrap">
                  <p className="font-semibold">{formatarDiaEData(prazo.vencimento)}</p>
                  <p className="text-xs text-subtle">{prazo.vencimento.slice(0, 4)}</p>
                </td>
                <td className="min-w-72">
                  <p className="font-medium">{prazo.regra.titulo}</p>
                  <p className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted">
                    <Badge tom={prazo.regra.tipo === 'expectativa' ? 'info' : 'neutral'}>{TIPOS_PRAZO[prazo.regra.tipo]}</Badge>
                    {prazo.regra.baseLegal}
                  </p>
                  <p className="mt-1 text-xs text-subtle">
                    {prazo.cumpridoEm ? `Cumprido em ${formatarData(prazo.cumpridoEm)}. ` : ''}
                    {prazo.explicacao}.
                  </p>
                </td>
                <td className="min-w-56">
                  <Link href={`/processos/${prazo.processo.id}`} className="font-medium text-brand-700 hover:underline">
                    {prazo.processo.empreendimento}
                  </Link>
                  <p className="text-xs text-muted">{prazo.cliente.nome}</p>
                </td>
                <td className="whitespace-nowrap text-muted">{prazo.processo.responsavel}</td>
                <td>
                  <SituacaoPrazo prazo={prazo} hoje={dia} />
                </td>
              </tr>
            ))}
            {lista.length === 0 && (
              <tr>
                <td colSpan={5} className="py-10 text-center text-muted">
                  Nenhum prazo neste filtro.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Card>
    </>
  )
}

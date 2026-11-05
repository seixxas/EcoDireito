import type { Metadata } from 'next'
import { LinkRapido } from '@/components/ui/link-rapido'
import { classeBotao } from '@/components/ui/form'
import { PageHeader } from '@/components/ui/page-header'
import { ItemResumo, Resumo } from '@/components/ui/resumo'
import { Secao } from '@/components/ui/secao'
import { Situacao } from '@/components/ui/situacao'
import { listarPropostas } from '@/data/processos'
import { hoje } from '@/data/hoje'
import { exigirArea } from '@/data/sessao'
import { DIAS_PARA_RETORNO, ESTADOS_PROPOSTA, numerosDoComercial, type EstadoProposta } from '@/domain/propostas'
import { somarDias } from '@/lib/datas'
import { brl, contar, formatarData } from '@/lib/formatar'
import { pode } from '@/lib/permissoes'
import { AbasDoComercial } from './_components/abas-do-comercial'

export const metadata: Metadata = { title: 'Propostas' }

type Item = Awaited<ReturnType<typeof listarPropostas>>[number]

const COLUNAS: EstadoProposta[] = ['elaboracao', 'enviada', 'aprovada', 'recusada']

/** Aprovadas e recusadas antigas saem do funil (continuam nos processos). */
const DIAS_NO_FUNIL = 90

function quando(item: Item) {
  const { situacao, proposta } = item
  if (situacao.estado === 'elaboracao') return `Criada em ${formatarData(proposta.criadaEm)}`
  if (situacao.estado === 'enviada') return `Enviada há ${contar(situacao.diasSemResposta ?? 0, 'dia', 'dias')}`
  if (situacao.estado === 'aprovada') return `Aprovada em ${formatarData(situacao.aprovadaEm!)}`
  return `Recusada em ${formatarData(situacao.recusadaEm!)}`
}

function Cartao({ item }: { item: Item }) {
  const { processo, cliente, valor, situacao } = item
  return (
    <li>
      <LinkRapido
        href={`/processos/${processo.id}?aba=proposta`}
        className="block rounded-md border border-line bg-surface p-3 transition-colors hover:border-brand-300 hover:bg-brand-50"
      >
        <p className="font-medium text-ink">{processo.empreendimento}</p>
        <p className="truncate text-xs text-muted">{cliente.nome}</p>
        {valor !== undefined && <p className="mt-2 tabular-nums text-ink">{brl(valor)}</p>}
        <p className="mt-1 text-xs text-muted">{quando(item)}</p>
        {situacao.pedeRetorno && (
          <Situacao tom="warn" className="mt-1 text-xs">
            Sem resposta: ligar para o cliente
          </Situacao>
        )}
        {situacao.estado === 'recusada' && situacao.motivo && <p className="mt-1 text-xs text-subtle">{situacao.motivo}</p>}
      </LinkRapido>
    </li>
  )
}

/** O funil de propostas: cada proposta é a fase 1 de um processo, do texto em elaboração até aprovada (fase 2) ou recusada. */
export default async function PaginaComercial() {
  const [usuario, itens, dia] = await Promise.all([exigirArea('comercial'), listarPropostas(), hoje()])
  const corte = somarDias(dia, -DIAS_NO_FUNIL)
  const noFunil = itens.filter(({ situacao: s }) => (s.estado !== 'aprovada' || s.aprovadaEm! >= corte) && (s.estado !== 'recusada' || s.recusadaEm! >= corte))
  const numeros = numerosDoComercial(
    itens.map((i) => ({ valor: i.valor ?? 0, situacao: i.situacao })),
    dia,
  )
  const verValores = itens.some((i) => i.valor !== undefined)

  return (
    <>
      <AbasDoComercial ativa="propostas" />
      <PageHeader
        titulo="Propostas"
        resumo={`${contar(numeros.quantasEmAberto, 'proposta em aberto', 'propostas em aberto')}${numeros.pedemRetorno ? `, ${numeros.pedemRetorno} sem resposta há mais de ${DIAS_PARA_RETORNO} dias` : ''}. Aprovada, a proposta vira processo na fase Documentação.`}
        acoes={
          pode(usuario.papel, 'comercial', 'editar') && (
            <LinkRapido href="/comercial/nova" className={classeBotao()}>
              Nova proposta
            </LinkRapido>
          )
        }
      />

      <Resumo className="mb-8">
        {verValores && <ItemResumo rotulo="Em aberto" valor={brl(numeros.emAberto)} detalhe="em elaboração e enviadas" />}
        <ItemResumo rotulo="Viram processo" valor={numeros.conversao !== undefined ? `${numeros.conversao}%` : '—'} detalhe="das decididas nos últimos 6 meses" />
        <ItemResumo rotulo="Tempo até aprovar" valor={numeros.diasAteAprovar !== undefined ? contar(numeros.diasAteAprovar, 'dia', 'dias') : '—'} detalhe="mediana, do envio ao aceite" />
        <ItemResumo rotulo="Pedem retorno" valor={String(numeros.pedemRetorno)} detalhe={`enviadas há mais de ${DIAS_PARA_RETORNO} dias`} tom={numeros.pedemRetorno ? 'warn' : 'neutral'} />
      </Resumo>

      <Secao titulo="Funil de propostas">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {COLUNAS.map((estado) => {
            const daColuna = noFunil.filter((i) => i.situacao.estado === estado)
            return (
              <div key={estado} className="rounded-lg border border-line bg-rail/60 p-2">
                <p className="flex items-baseline justify-between gap-2 px-1.5 pb-2 pt-1 text-sm">
                  <span className="font-medium text-ink">
                    {ESTADOS_PROPOSTA[estado]} <span className="text-subtle">{daColuna.length}</span>
                  </span>
                  {verValores && <span className="tabular-nums text-muted">{brl(daColuna.reduce((soma, i) => soma + (i.valor ?? 0), 0))}</span>}
                </p>
                <ul className="space-y-2">
                  {daColuna.map((item) => (
                    <Cartao key={item.processo.id} item={item} />
                  ))}
                </ul>
                {daColuna.length === 0 && <p className="px-1.5 pb-2 text-xs text-subtle">Nenhuma.</p>}
              </div>
            )
          })}
        </div>
        <p className="mt-3 text-xs text-subtle">Aprovadas e recusadas aparecem aqui por {DIAS_NO_FUNIL} dias. Clique numa proposta para ver o texto e marcar o que aconteceu.</p>
      </Secao>
    </>
  )
}

import type { Metadata } from 'next'
import { LinkRapido } from '@/components/ui/link-rapido'
import { classeBotao } from '@/components/ui/form'
import { PageHeader } from '@/components/ui/page-header'
import { ItemResumo, Resumo } from '@/components/ui/resumo'
import { Situacao } from '@/components/ui/situacao'
import { Zona, type TomZona } from '@/components/ui/zona'
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

const ETAPAS: { estado: EstadoProposta; numero: string; tom: TomZona }[] = [
  { estado: 'elaboracao', numero: '1. ', tom: 'neutra' },
  { estado: 'enviada', numero: '2. ', tom: 'neutra' },
  { estado: 'aprovada', numero: '3. ', tom: 'proximos' },
  { estado: 'recusada', numero: '', tom: 'apagada' },
]

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
        href={`/projetos/${processo.id}?aba=proposta`}
        className="group flex h-full flex-col rounded-md bg-surface px-3 py-2 text-ink transition-colors hover:bg-brand-50"
      >
        <p className="text-sm font-semibold leading-snug">{processo.empreendimento}</p>
        <p className="text-xs text-muted">{cliente.nome}</p>
        <p className="mt-1 flex flex-wrap items-baseline justify-between gap-x-3 text-xs text-muted">
          <span>{quando(item)}</span>
          {valor !== undefined && <span className="text-sm font-semibold text-ink">{brl(valor)}</span>}
        </p>
        {situacao.pedeRetorno && (
          <Situacao tom="warn" className="mt-1 self-start">
            Sem resposta: ligar para o cliente
          </Situacao>
        )}
        {situacao.estado === 'recusada' && situacao.motivo && <p className="mt-1 rounded-md bg-apagado px-2 py-1.5 text-xs">{situacao.motivo}</p>}
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
  const etapas = ETAPAS.map((etapa) => {
    const daEtapa = noFunil.filter((i) => i.situacao.estado === etapa.estado)
    return { ...etapa, itens: daEtapa, titulo: `${etapa.numero}${ESTADOS_PROPOSTA[etapa.estado]}`, soma: brl(daEtapa.reduce((soma, i) => soma + (i.valor ?? 0), 0)) }
  })

  return (
    <>
      <AbasDoComercial ativa="propostas" />
      <PageHeader
        titulo="Propostas"
        resumo={`${contar(numeros.quantasEmAberto, 'proposta em aberto', 'propostas em aberto')}${numeros.pedemRetorno ? `, ${numeros.pedemRetorno} sem resposta há mais de ${DIAS_PARA_RETORNO} dias` : ''}. Aprovada, a proposta vira projeto na fase Documentação.`}
        acoes={
          pode(usuario.papel, 'comercial', 'editar') && (
            <LinkRapido href="/comercial/nova" className={classeBotao('primario')}>
              + Nova proposta
            </LinkRapido>
          )
        }
      />

      <Resumo className="xl:grid-cols-4">
        {verValores && <ItemResumo rotulo="Em aberto" valor={brl(numeros.emAberto)} detalhe="em elaboração e enviadas" />}
        <ItemResumo rotulo="Viram projeto" valor={numeros.conversao !== undefined ? `${numeros.conversao}%` : '—'} detalhe="das decididas nos últimos 6 meses" />
        <ItemResumo rotulo="Tempo até aprovar" valor={numeros.diasAteAprovar !== undefined ? contar(numeros.diasAteAprovar, 'dia', 'dias') : '—'} detalhe="mediana, do envio ao aceite" />
        <ItemResumo
          rotulo="Pedem retorno"
          valor={contar(numeros.pedemRetorno, 'proposta', 'propostas')}
          detalhe={`enviadas há mais de ${DIAS_PARA_RETORNO} dias`}
          tom={numeros.pedemRetorno ? 'warn' : 'neutral'}
        />
      </Resumo>

      <div className="mt-3 grid items-start gap-2 md:grid-cols-2 xl:grid-cols-4">
        {etapas.map(({ estado, titulo, tom, itens: daEtapa, soma }) => {
          const quantas = contar(daEtapa.length, 'proposta', 'propostas')
          return (
            <Zona key={estado} tom={tom} titulo={titulo} detalhe={verValores ? `${quantas} · ${soma}` : quantas} className="mb-0!">
              {daEtapa.length > 0 ? (
                <ul className="grid gap-1">
                  {daEtapa.map((item) => (
                    <Cartao key={item.processo.id} item={item} />
                  ))}
                </ul>
              ) : (
                <p className="px-1 text-xs text-muted">Nenhuma.</p>
              )}
            </Zona>
          )
        })}
      </div>

      <p className="mt-2 text-xs text-muted">Aprovadas e recusadas aparecem aqui por {DIAS_NO_FUNIL} dias. Abra uma proposta para ver o texto e marcar o que aconteceu.</p>
    </>
  )
}

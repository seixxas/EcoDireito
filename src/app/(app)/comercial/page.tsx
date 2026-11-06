import type { Metadata } from 'next'
import { Fragment } from 'react'
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
        className="group flex h-full flex-col gap-1 rounded-lg bg-surface px-5 py-4.5 text-ink transition-colors hover:bg-brand-50"
      >
        <p className="text-[1.25rem] font-semibold leading-[1.3]">{processo.empreendimento}</p>
        <p className="text-xs text-muted">{cliente.nome}</p>
        {valor !== undefined && <p className="mt-2 text-lg font-semibold">{brl(valor)}</p>}
        <p className="text-xs text-muted">{quando(item)}</p>
        {situacao.pedeRetorno && (
          <Situacao tom="warn" className="mt-2 self-start">
            Sem resposta: ligar para o cliente
          </Situacao>
        )}
        {situacao.estado === 'recusada' && situacao.motivo && <p className="mt-1.5 rounded-md bg-apagado px-3 py-2 text-xs">{situacao.motivo}</p>}
        <span className={classeBotao('secundario', 'mt-3 self-start group-hover:bg-brand-100')}>Abrir a proposta</span>
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
            <LinkRapido href="/comercial/nova" className={classeBotao('primario', 'min-h-14 text-[1.25rem]')}>
              + Nova proposta
            </LinkRapido>
          )
        }
      />

      <Resumo>
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

      <nav aria-label="Etapas do funil">
        <ol className="mb-7 mt-9 flex flex-wrap gap-3">
          {etapas.map(({ estado, titulo, itens: daEtapa, soma }, i) => (
            <Fragment key={estado}>
              {estado === 'recusada' ? (
                <li aria-hidden className="hidden w-6 xl:block" />
              ) : (
                i > 0 && (
                  <li aria-hidden className="hidden self-center text-[1.375rem] font-semibold text-brand-700 md:block">
                    →
                  </li>
                )
              )}
              <li className="max-md:w-full">
                <a href={`#${estado}`} className="flex min-h-18 flex-col justify-center rounded-lg border-2 border-brand-700 bg-surface px-4.5 py-2 text-ink transition-colors hover:bg-brand-50">
                  <b className="font-semibold text-brand-700">{titulo}</b>
                  <span className="text-xs">{verValores ? `${daEtapa.length} · ${soma}` : contar(daEtapa.length, 'proposta', 'propostas')}</span>
                </a>
              </li>
            </Fragment>
          ))}
        </ol>
      </nav>

      {etapas.map(({ estado, titulo, tom, itens: daEtapa, soma }) => {
        const quantas = contar(daEtapa.length, 'proposta', 'propostas')
        return (
          <div key={estado} id={estado} className="scroll-mt-6">
            <Zona tom={tom} titulo={titulo} detalhe={verValores ? `${quantas} · ${soma}` : quantas}>
              {daEtapa.length > 0 ? (
                <ul className="grid grid-cols-1 gap-3 pb-1 md:grid-cols-2 xl:grid-cols-3">
                  {daEtapa.map((item) => (
                    <Cartao key={item.processo.id} item={item} />
                  ))}
                </ul>
              ) : (
                <p className="pb-3 text-sm text-muted">Nenhuma.</p>
              )}
            </Zona>
          </div>
        )
      })}

      <p className="text-sm text-muted">Aprovadas e recusadas aparecem aqui por {DIAS_NO_FUNIL} dias. Abra uma proposta para ver o texto e marcar o que aconteceu.</p>
    </>
  )
}

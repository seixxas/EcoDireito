import type { Metadata } from 'next'
import { LinkRapido } from '@/components/ui/link-rapido'
import { classeBotao } from '@/components/ui/form'
import { PageHeader } from '@/components/ui/page-header'
import { ItemResumo, Resumo } from '@/components/ui/resumo'
import type { TomZona } from '@/components/ui/zona'
import { listarPropostas } from '@/data/processos'
import { hoje } from '@/data/hoje'
import { exigirArea } from '@/data/sessao'
import { DIAS_PARA_RETORNO, ESTADOS_PROPOSTA, numerosDoComercial, type EstadoProposta } from '@/domain/propostas'
import { somarDias } from '@/lib/datas'
import { brl, contar, formatarData } from '@/lib/formatar'
import { pode } from '@/lib/permissoes'
import { AbasDoComercial } from './_components/abas-do-comercial'
import { QuadroDePropostas, type ColunaDoQuadro } from './_components/quadro-de-propostas'

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
  const mover = pode(usuario.papel, 'prazos', 'editar')
  const colunas: ColunaDoQuadro[] = ETAPAS.map(({ estado, numero, tom }) => {
    const daEtapa = noFunil.filter((i) => i.situacao.estado === estado)
    const quantas = contar(daEtapa.length, 'proposta', 'propostas')
    return {
      estado,
      tom,
      titulo: `${numero}${ESTADOS_PROPOSTA[estado]}`,
      detalhe: verValores ? `${quantas} · ${brl(daEtapa.reduce((soma, i) => soma + (i.valor ?? 0), 0))}` : quantas,
      cartoes: daEtapa.map((item) => ({
        id: item.processo.id,
        estado,
        empreendimento: item.processo.empreendimento,
        cliente: item.cliente.nome,
        valor: item.valor !== undefined ? brl(item.valor) : undefined,
        quando: quando(item),
        pedeRetorno: item.situacao.pedeRetorno,
        motivo: item.situacao.motivo,
      })),
    }
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

      <QuadroDePropostas colunas={colunas} mover={mover} />

      <p className="mt-2 text-xs text-muted">Aprovadas e recusadas aparecem aqui por {DIAS_NO_FUNIL} dias. {mover ? 'Arraste o cartão para a coluna seguinte para marcar o que aconteceu, ou abra a proposta para ver o texto.' : 'Abra uma proposta para ver o texto.'}</p>
    </>
  )
}

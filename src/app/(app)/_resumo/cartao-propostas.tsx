import { Icone, type NomeIcone } from '@/components/ui/icone'
import { LinkRapido } from '@/components/ui/link-rapido'
import { listarPropostas } from '@/data/processos'
import { DIAS_PARA_RETORNO, numerosDoComercial, type EstadoProposta } from '@/domain/propostas'
import { cn } from '@/lib/cn'
import { somarDias, type DataISO } from '@/lib/datas'
import { brl, contar } from '@/lib/formatar'
import { CartaoResumo, Destaque } from './cartao'

/** O mesmo corte da tela Comercial: aprovadas e recusadas saem do funil depois de 90 dias. */
const DIAS_NO_FUNIL = 90

const FUNIL: { estado: EstadoProposta; nome: string; icone: NomeIcone; corDoIcone: string; corDaBarra: string }[] = [
  { estado: 'elaboracao', nome: 'Em elaboração', icone: 'edit_note', corDoIcone: 'text-muted', corDaBarra: 'bg-[#B9C2B7]' },
  { estado: 'enviada', nome: 'Enviadas', icone: 'send', corDoIcone: 'text-info', corDaBarra: 'bg-[#86A9DB]' },
  { estado: 'aprovada', nome: 'Aprovadas', icone: 'check_circle', corDoIcone: 'text-brand-700', corDaBarra: 'bg-brand-500' },
  { estado: 'recusada', nome: 'Recusadas', icone: 'cancel', corDoIcone: 'text-danger', corDaBarra: 'bg-[#E39A90]' },
]

/** Funil de propostas com o valor em aberto, a conversão e o aviso das que pedem retorno. */
export async function CartaoPropostas({ dia }: { dia: DataISO }) {
  const itens = await listarPropostas()
  const numeros = numerosDoComercial(
    itens.map((i) => ({ valor: i.valor ?? 0, situacao: i.situacao })),
    dia,
  )
  const verValores = itens.some((i) => i.valor !== undefined)
  const corte = somarDias(dia, -DIAS_NO_FUNIL)
  const noFunil = itens.filter(({ situacao: s }) => (s.estado !== 'aprovada' || s.aprovadaEm! >= corte) && (s.estado !== 'recusada' || s.recusadaEm! >= corte))
  const linhas = FUNIL.map((etapa) => {
    const daEtapa = noFunil.filter((i) => i.situacao.estado === etapa.estado)
    return { ...etapa, quantas: daEtapa.length, soma: daEtapa.reduce((soma, i) => soma + (i.valor ?? 0), 0) }
  })
  const maior = Math.max(1, ...linhas.map((l) => l.quantas))

  const retornos = itens.filter((i) => i.situacao.pedeRetorno)
  const unica = retornos.length === 1 ? retornos[0] : undefined
  const aviso = unica
    ? `1 proposta sem resposta há ${contar(unica.situacao.diasSemResposta ?? 0, 'dia', 'dias')}`
    : `${retornos.length} propostas sem resposta há mais de ${DIAS_PARA_RETORNO} dias`

  return (
    <CartaoResumo icone="description" titulo="Propostas" href="/comercial">
      <div className="flex flex-wrap gap-x-6 gap-y-2">
        {verValores && <Destaque icone="hourglass_top" rotulo="Em aberto" valor={brl(numeros.emAberto)} className="min-w-0" />}
        <Destaque icone="trending_up" rotulo="Viram projeto" valor={numeros.conversao !== undefined ? `${numeros.conversao}%` : '—'} />
      </div>

      <div className="flex flex-col gap-2.5">
        {linhas.map(({ estado, nome, icone, corDoIcone, corDaBarra, quantas, soma }) => (
          <LinkRapido key={estado} href="/comercial" className="group flex flex-col gap-1">
            <span className="flex flex-wrap justify-between gap-x-2 text-xs">
              <span className="flex items-center gap-1.5 text-ink group-hover:underline">
                <Icone nome={icone} className={cn('text-lg', corDoIcone)} />
                {nome} · {quantas}
              </span>
              {verValores && <span className="text-muted">{brl(soma)}</span>}
            </span>
            <span className="block h-3.5 w-full overflow-hidden rounded-[4px] bg-painel">
              <span className={cn('block h-full rounded-[4px]', corDaBarra)} style={{ width: `${(quantas / maior) * 100}%` }} />
            </span>
          </LinkRapido>
        ))}
      </div>

      {retornos.length > 0 && (
        <LinkRapido
          href={unica ? `/projetos/${unica.processo.id}?aba=proposta` : '/comercial'}
          className="mt-auto flex items-center gap-2 rounded-[10px] bg-warn-soft px-3 py-2.5 text-[0.84375rem] font-semibold text-warn hover:underline"
        >
          <Icone nome="call" className="text-[1.1875rem]" />
          <span className="min-w-0 flex-1">{aviso}</span>
          <Icone nome="arrow_forward" className="text-lg" />
        </LinkRapido>
      )}
    </CartaoResumo>
  )
}

import { Icone, type NomeIcone } from '@/components/ui/icone'
import { LinkRapido } from '@/components/ui/link-rapido'
import { listarPropostas } from '@/data/processos'
import { DIAS_PARA_RETORNO, numerosDoComercial, type EstadoProposta } from '@/domain/propostas'
import { somarDias, type DataISO } from '@/lib/datas'
import { brl, contar } from '@/lib/formatar'
import { CartaoResumo, Destaque } from './cartao'

/** O mesmo corte da tela Comercial: aprovadas e recusadas saem do funil depois de 90 dias. */
const DIAS_NO_FUNIL = 90

/** Cartão verde: as fatias vão do verde claro (em elaboração) ao escuro (aprovadas); recusadas em cinza. */
const FUNIL: { estado: EstadoProposta; nome: string; icone: NomeIcone; cor: string }[] = [
  { estado: 'elaboracao', nome: 'Em elaboração', icone: 'edit_note', cor: 'var(--color-brand-300)' },
  { estado: 'enviada', nome: 'Enviadas', icone: 'send', cor: 'var(--color-brand-500)' },
  { estado: 'aprovada', nome: 'Aprovadas', icone: 'check_circle', cor: 'var(--color-brand-900)' },
  { estado: 'recusada', nome: 'Recusadas', icone: 'cancel', cor: 'var(--color-subtle)' },
]

/** Raio da rosca num quadro de 42×42: a circunferência dá 100, então o tamanho de cada fatia é o próprio percentual. */
const RAIO = 15.9155

/** Gráfico de rosca (pizza com furo): uma fatia por etapa do funil; no meio, quantas viram projeto. */
function Pizza({ fatias, total, conversao }: { fatias: { nome: string; quantas: number; cor: string }[]; total: number; conversao?: number }) {
  let andou = 0
  return (
    <svg
      viewBox="0 0 42 42"
      role="img"
      aria-label={`${fatias.map((f) => `${f.nome}: ${f.quantas}`).join(', ')}. ${conversao ?? '—'}% viram projeto`}
      className="size-32 shrink-0 -rotate-90"
    >
      <circle cx="21" cy="21" r={RAIO} fill="none" stroke="var(--color-painel)" strokeWidth="6" />
      {total > 0 &&
        fatias.map(({ nome, quantas, cor }) => {
          const tamanho = (quantas / total) * 100
          const inicio = andou
          andou += tamanho
          return tamanho > 0 && <circle key={nome} cx="21" cy="21" r={RAIO} fill="none" stroke={cor} strokeWidth="6" strokeDasharray={`${tamanho} ${100 - tamanho}`} strokeDashoffset={-inicio} />
        })}
      <g transform="rotate(90 21 21)" textAnchor="middle">
        <text x="21" y="21" className="fill-ink text-[8px] font-semibold">
          {conversao !== undefined ? `${conversao}%` : '—'}
        </text>
        <text x="21" y="27" className="fill-muted text-[3.4px]">
          viram projeto
        </text>
      </g>
    </svg>
  )
}

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
  const total = linhas.reduce((soma, l) => soma + l.quantas, 0)

  const retornos = itens.filter((i) => i.situacao.pedeRetorno)
  const unica = retornos.length === 1 ? retornos[0] : undefined
  const aviso = unica
    ? `1 proposta sem resposta há ${contar(unica.situacao.diasSemResposta ?? 0, 'dia', 'dias')}`
    : `${retornos.length} propostas sem resposta há mais de ${DIAS_PARA_RETORNO} dias`

  return (
    <CartaoResumo icone="description" titulo="Propostas" href="/comercial" tom="verde">
      {verValores && <Destaque icone="hourglass_top" rotulo="Em aberto" valor={brl(numeros.emAberto)} className="min-w-0" />}

      <div className="flex flex-1 flex-wrap items-center gap-x-5 gap-y-3">
        <Pizza fatias={linhas} total={total} conversao={numeros.conversao} />
        <ul className="flex min-w-40 flex-1 flex-col gap-1.5">
          {linhas.map(({ estado, nome, icone, cor, quantas, soma }) => (
            <li key={estado}>
              <LinkRapido href="/comercial" className="group flex items-center gap-2 text-xs">
                <span className="size-2.5 shrink-0 rounded-[3px]" style={{ background: cor }} />
                <Icone nome={icone} className="text-base text-muted" />
                <span className="min-w-0 flex-1 truncate text-ink group-hover:underline">
                  {nome} · <b className="font-semibold">{quantas}</b>
                </span>
                {verValores && <span className="text-muted">{brl(soma)}</span>}
              </LinkRapido>
            </li>
          ))}
        </ul>
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

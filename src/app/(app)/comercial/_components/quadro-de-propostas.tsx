'use client'

import { useRef, useState, useTransition } from 'react'
import { AreaTexto, Campo, classeBotao } from '@/components/ui/form'
import { LinkRapido } from '@/components/ui/link-rapido'
import { Situacao } from '@/components/ui/situacao'
import { Zona, type TomZona } from '@/components/ui/zona'
import { DIAS_PARA_RETORNO, ESTADOS_PROPOSTA, etapaParaMover, type EstadoProposta } from '@/domain/propostas'
import { cn } from '@/lib/cn'
import { moverProposta } from '../actions'

export type CartaoDoQuadro = {
  id: string
  estado: EstadoProposta
  empreendimento: string
  cliente: string
  /** Já em reais ("R$ 12.000,00"); vazio para quem não vê o financeiro. */
  valor?: string
  quando: string
  pedeRetorno: boolean
  motivo?: string
}

export type ColunaDoQuadro = { estado: EstadoProposta; titulo: string; tom: TomZona; detalhe: string; cartoes: CartaoDoQuadro[] }

/** O que acontece ao soltar em cada coluna, para a pessoa confirmar antes. */
const CONSEQUENCIA: Partial<Record<EstadoProposta, string>> = {
  enviada: `Fica com a data de hoje. Depois de ${DIAS_PARA_RETORNO} dias sem resposta, ela pede retorno.`,
  aprovada: 'O projeto passa para a fase Documentação e a 1ª parcela fica pronta para faturar.',
  recusada: 'Fica com a data de hoje. O motivo aparece no cartão e no projeto.',
}

type Pendente = { cartao: CartaoDoQuadro; para: EstadoProposta }

/** O quadro de Propostas. Quem pode marcar etapas arrasta o cartão para a coluna seguinte; o clique abre a proposta. */
export function QuadroDePropostas({ colunas, mover }: { colunas: ColunaDoQuadro[]; mover: boolean }) {
  const [arrastando, setArrastando] = useState<CartaoDoQuadro>()
  const [sobre, setSobre] = useState<EstadoProposta>()
  const [pendente, setPendente] = useState<Pendente>()
  const [erro, setErro] = useState<string>()
  const [salvando, iniciar] = useTransition()
  const caixa = useRef<HTMLDialogElement>(null)
  const motivo = useRef<HTMLTextAreaElement>(null)

  const aceita = (para: EstadoProposta) => arrastando !== undefined && etapaParaMover(arrastando.estado, para) !== undefined

  const soltar = (para: EstadoProposta) => {
    setSobre(undefined)
    if (!arrastando || !aceita(para)) return
    setErro(undefined)
    setPendente({ cartao: arrastando, para })
    caixa.current?.showModal()
  }

  const confirmar = () => {
    if (!pendente) return
    iniciar(async () => {
      const resposta = await moverProposta(pendente.cartao.id, pendente.para, motivo.current?.value)
      if (resposta.erro) return setErro(resposta.erro)
      caixa.current?.close()
      setPendente(undefined)
    })
  }

  return (
    <>
      <div className="mt-3 grid items-start gap-2 md:grid-cols-2 xl:grid-cols-4">
        {colunas.map(({ estado, titulo, tom, detalhe, cartoes }) => (
          <div
            key={estado}
            onDragOver={(evento) => {
              if (!aceita(estado)) return
              evento.preventDefault()
              setSobre(estado)
            }}
            onDragLeave={() => setSobre((atual) => (atual === estado ? undefined : atual))}
            onDrop={(evento) => {
              evento.preventDefault()
              soltar(estado)
            }}
            className={cn(
              'rounded-lg outline-2 outline-offset-2 transition-[outline-color]',
              arrastando && aceita(estado) ? 'outline-dashed outline-brand-500' : 'outline-transparent',
              sobre === estado && 'outline-solid outline-brand-700',
            )}
          >
            <Zona tom={tom} titulo={titulo} detalhe={detalhe} className="mb-0!">
              {cartoes.length > 0 ? (
                <ul className="grid gap-1">
                  {cartoes.map((cartao) => (
                    <Cartao
                      key={cartao.id}
                      cartao={cartao}
                      arrastavel={mover && cartao.estado !== 'aprovada' && cartao.estado !== 'recusada'}
                      arrastado={arrastando?.id === cartao.id}
                      onInicio={() => setArrastando(cartao)}
                      onFim={() => {
                        setArrastando(undefined)
                        setSobre(undefined)
                      }}
                    />
                  ))}
                </ul>
              ) : (
                <p className="px-1 text-xs text-muted">{arrastando && aceita(estado) ? 'Solte aqui.' : 'Nenhuma.'}</p>
              )}
            </Zona>
          </div>
        ))}
      </div>

      <dialog ref={caixa} className="dialogo" onClose={() => setPendente(undefined)}>
        {pendente && (
          <>
            <p className="text-lg font-semibold leading-tight">Marcar como {ESTADOS_PROPOSTA[pendente.para].toLowerCase()}?</p>
            <div className="mt-2 rounded-md bg-painel px-3 py-2 text-sm font-medium">
              {pendente.cartao.empreendimento} · {pendente.cartao.cliente}
            </div>
            <p className="mt-2 text-sm">{CONSEQUENCIA[pendente.para]}</p>
            {pendente.para === 'recusada' && (
              <Campo rotulo="Motivo" dica="Opcional. Aparece no cartão e no projeto." className="mt-3">
                <AreaTexto ref={motivo} rows={2} placeholder="Ex.: achou caro, fechou com outro escritório" />
              </Campo>
            )}
            {erro && (
              <p role="alert" className="mt-2 text-sm text-danger">
                {erro}
              </p>
            )}
            <div className="mt-4 flex flex-wrap justify-end gap-2">
              <button type="button" onClick={() => caixa.current?.close()} className={classeBotao('secundario')}>
                Não, voltar
              </button>
              <button type="button" disabled={salvando} onClick={confirmar} className={classeBotao(pendente.para === 'recusada' ? 'perigo' : 'primario')}>
                {salvando ? 'Salvando…' : `Sim, marcar como ${ESTADOS_PROPOSTA[pendente.para].toLowerCase()}`}
              </button>
            </div>
          </>
        )}
      </dialog>
    </>
  )
}

function Cartao({
  cartao,
  arrastavel,
  arrastado,
  onInicio,
  onFim,
}: {
  cartao: CartaoDoQuadro
  arrastavel: boolean
  arrastado: boolean
  onInicio: () => void
  onFim: () => void
}) {
  const { id, empreendimento, cliente, valor, quando, pedeRetorno, motivo, estado } = cartao
  return (
    <li>
      <LinkRapido
        href={`/projetos/${id}?aba=proposta`}
        draggable={arrastavel}
        onDragStart={(evento) => {
          evento.dataTransfer.effectAllowed = 'move'
          evento.dataTransfer.setData('text/plain', id)
          onInicio()
        }}
        onDragEnd={onFim}
        title={arrastavel ? 'Clique para abrir ou arraste para a próxima coluna' : undefined}
        // Ao passar o mouse, o cartão sobe de leve (sem mexer em quem pediu menos movimento).
        className={cn(
          'group flex h-full flex-col rounded-md bg-surface px-3 py-2 text-ink transition duration-200 hover:bg-brand-50 hover:shadow-md hover:shadow-brand-900/10 motion-safe:hover:-translate-y-px dark:hover:shadow-black/40',
          arrastavel && 'cursor-grab active:cursor-grabbing',
          arrastado && 'opacity-50',
        )}
      >
        <p className="text-sm font-semibold leading-snug">{empreendimento}</p>
        <p className="text-xs text-muted">{cliente}</p>
        <p className="mt-1 flex flex-wrap items-baseline justify-between gap-x-3 text-xs text-muted">
          <span>{quando}</span>
          {valor !== undefined && <span className="text-sm font-semibold text-ink">{valor}</span>}
        </p>
        {pedeRetorno && (
          <Situacao tom="warn" className="mt-1 self-start">
            Sem resposta: ligar para o cliente
          </Situacao>
        )}
        {estado === 'recusada' && motivo && <p className="mt-1 rounded-md bg-apagado px-2 py-1.5 text-xs">{motivo}</p>}
      </LinkRapido>
    </li>
  )
}

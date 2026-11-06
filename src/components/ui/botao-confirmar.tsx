'use client'

import { useRef, type ReactNode } from 'react'
import { useFormStatus } from 'react-dom'
import { classeBotao, type VarianteBotao } from './form'

type Props = {
  children: ReactNode
  /** A pergunta: "Ignorar este ato do Diário Oficial?" */
  titulo: string
  /** Do que se trata, numa faixa: "Comunique-se · Lumen Pompeia · 05/11". */
  oQue?: ReactNode
  /** O que acontece se confirmar. */
  consequencia?: ReactNode
  /** Texto do botão que confirma: "Sim, ignorar o ato". */
  sim: string
  variante?: VarianteBotao
  className?: string
}

/**
 * Para ação que não dá para desfazer. Vai dentro do `<form>` da Server Action, no lugar do botão de enviar: pergunta antes,
 * e o "sim" é que envia o formulário. Campos colocados em `oQue` ou `consequencia` vão junto.
 */
export function BotaoConfirmar({ children, titulo, oQue, consequencia, sim, variante = 'perigo', className }: Props) {
  const caixa = useRef<HTMLDialogElement>(null)
  const { pending } = useFormStatus()
  return (
    <>
      <button type="button" disabled={pending} onClick={() => caixa.current?.showModal()} className={classeBotao(variante, className)}>
        {pending ? 'Salvando…' : children}
      </button>
      <dialog ref={caixa} className="dialogo">
        <p className="text-[1.875rem] font-semibold leading-tight">{titulo}</p>
        {oQue && <div className="mt-3 rounded-lg bg-painel px-4 py-3 font-medium">{oQue}</div>}
        {consequencia && <div className="mt-3 whitespace-normal">{consequencia}</div>}
        <div className="mt-6 flex flex-wrap justify-between gap-4">
          <button type="button" onClick={() => caixa.current?.close()} className={classeBotao('secundario', 'min-h-14')}>
            Não, voltar
          </button>
          <button
            type="submit"
            onClick={(evento) => {
              // Com campo obrigatório vazio, a caixa fica aberta: fechada, o navegador trava o envio sem mostrar por quê.
              if (evento.currentTarget.form?.checkValidity()) caixa.current?.close()
            }}
            className={classeBotao('perigo', 'min-h-14')}
          >
            {sim}
          </button>
        </div>
      </dialog>
    </>
  )
}

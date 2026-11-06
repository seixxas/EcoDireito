'use client'

import { useRef, type ReactNode } from 'react'
import { useFormStatus } from 'react-dom'
import { classeBotao, type TamanhoBotao, type VarianteBotao } from './form'

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
  tamanho?: TamanhoBotao
  className?: string
}

/**
 * Para ação que não dá para desfazer. Vai dentro do `<form>` da Server Action, no lugar do botão de enviar: pergunta antes,
 * e o "sim" é que envia o formulário. Campos colocados em `oQue` ou `consequencia` vão junto.
 */
export function BotaoConfirmar({ children, titulo, oQue, consequencia, sim, variante = 'perigo', tamanho, className }: Props) {
  const caixa = useRef<HTMLDialogElement>(null)
  const { pending } = useFormStatus()
  return (
    <>
      <button type="button" disabled={pending} onClick={() => caixa.current?.showModal()} className={classeBotao(variante, className, tamanho)}>
        {pending ? 'Salvando…' : children}
      </button>
      <dialog ref={caixa} className="dialogo">
        <p className="text-lg font-semibold leading-tight">{titulo}</p>
        {oQue && <div className="mt-2 rounded-md bg-painel px-3 py-2 text-sm font-medium">{oQue}</div>}
        {consequencia && <div className="mt-2 whitespace-normal text-sm">{consequencia}</div>}
        <div className="mt-4 flex flex-wrap justify-end gap-2">
          <button type="button" onClick={() => caixa.current?.close()} className={classeBotao('secundario')}>
            Não, voltar
          </button>
          <button
            type="submit"
            onClick={(evento) => {
              // Com campo obrigatório vazio, a caixa fica aberta: fechada, o navegador trava o envio sem mostrar por quê.
              if (evento.currentTarget.form?.checkValidity()) caixa.current?.close()
            }}
            className={classeBotao('perigo')}
          >
            {sim}
          </button>
        </div>
      </dialog>
    </>
  )
}

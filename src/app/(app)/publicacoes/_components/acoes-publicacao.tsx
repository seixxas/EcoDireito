'use client'

import Link from 'next/link'
import { useActionState, useState } from 'react'
import { BotaoEnviar } from '@/components/ui/botao-enviar'
import { Botao, Entrada, MensagemFormulario, classeBotao } from '@/components/ui/form'
import { confirmarAto, descartarAto } from '../actions'

/** Ações na linha do ato. Sem processo cadastrado, o caminho é cadastrar a partir do ato e voltar para confirmar. */
export function AcoesPublicacao({ id, temProcesso }: { id: string; temProcesso: boolean }) {
  const [confirmacao, confirmar] = useActionState(confirmarAto, {})
  const [descarte, descartar] = useActionState(descartarAto, {})
  const [descartando, setDescartando] = useState(false)

  if (descartando) {
    return (
      <form action={descartar} className="w-64 space-y-2">
        <input type="hidden" name="id" value={id} />
        <Entrada name="motivo" defaultValue={descarte.valores?.motivo} aria-label="Por que não é nosso?" placeholder="Por que não é nosso?" required autoFocus />
        {descarte.erros?.motivo && <p className="text-xs text-danger">{descarte.erros.motivo}</p>}
        <div className="flex justify-end gap-2">
          <Botao type="button" variante="secundario" onClick={() => setDescartando(false)}>
            Voltar
          </Botao>
          <BotaoEnviar variante="perigo">Descartar</BotaoEnviar>
        </div>
      </form>
    )
  }

  return (
    <div className="flex flex-col items-start gap-1.5 sm:items-end">
      <div className="flex gap-2">
        {temProcesso ? (
          <form action={confirmar}>
            <input type="hidden" name="id" value={id} />
            <BotaoEnviar>Confirmar</BotaoEnviar>
          </form>
        ) : (
          <Link href={`/processos/novo?ato=${encodeURIComponent(id)}`} className={classeBotao()}>
            Cadastrar processo
          </Link>
        )}
        <Botao variante="secundario" onClick={() => setDescartando(true)}>
          Não é nosso
        </Botao>
      </div>
      <MensagemFormulario estado={confirmacao} />
    </div>
  )
}

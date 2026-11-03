'use client'

import { Check, Plus, X } from 'lucide-react'
import Link from 'next/link'
import { useActionState, useState } from 'react'
import { BotaoEnviar } from '@/components/ui/botao-enviar'
import { Botao, Campo, Entrada, MensagemFormulario, classeBotao } from '@/components/ui/form'
import { confirmarAto, descartarAto } from '../actions'

/** Sem processo cadastrado, o caminho é cadastrar o processo a partir do ato e voltar para confirmar. */
export function AcoesPublicacao({ id, temProcesso, temEvento, prazos }: { id: string; temProcesso: boolean; temEvento: boolean; prazos: number }) {
  const [confirmacao, confirmar] = useActionState(confirmarAto, {})
  const [descarte, descartar] = useActionState(descartarAto, {})
  const [descartando, setDescartando] = useState(false)

  if (descartando) {
    return (
      <form action={descartar} className="space-y-2">
        <input type="hidden" name="id" value={id} />
        <Campo rotulo="Por que não é nosso?" erro={descarte.erros?.motivo}>
          <Entrada name="motivo" defaultValue={descarte.valores?.motivo} placeholder="Ex.: outra loja do cliente, fora do contrato" required autoFocus />
        </Campo>
        <MensagemFormulario estado={descarte} />
        <div className="flex gap-2">
          <BotaoEnviar variante="perigo">Descartar</BotaoEnviar>
          <Botao type="button" variante="secundario" onClick={() => setDescartando(false)}>
            Voltar
          </Botao>
        </div>
      </form>
    )
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {temProcesso ? (
          <form action={confirmar}>
            <input type="hidden" name="id" value={id} />
            <BotaoEnviar>
              <Check className="size-4" /> {!temEvento ? 'Confirmar' : prazos ? 'Confirmar e criar prazos' : 'Confirmar e lançar evento'}
            </BotaoEnviar>
          </form>
        ) : (
          <Link href={`/processos/novo?ato=${encodeURIComponent(id)}`} className={classeBotao()}>
            <Plus className="size-4" /> Cadastrar processo
          </Link>
        )}
        <Botao variante="secundario" onClick={() => setDescartando(true)}>
          <X className="size-4" /> Não é nosso
        </Botao>
      </div>
      <MensagemFormulario estado={confirmacao} />
    </div>
  )
}

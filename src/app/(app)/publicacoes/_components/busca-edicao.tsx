'use client'

import { useActionState } from 'react'
import { BotaoEnviar } from '@/components/ui/botao-enviar'
import { Entrada, MensagemFormulario } from '@/components/ui/form'
import { buscarEdicao } from '../actions'

/** "Buscar agora": o mesmo que o robô agendado fará todo dia útil. Serve também para buscar dias que ficaram para trás. */
export function BuscaEdicao({ dia }: { dia: string }) {
  const [estado, acao] = useActionState(buscarEdicao, {})
  // O erro do campo de data diz mais que o "Confira os campos destacados".
  const mensagem = estado.erros?.data ? { erro: estado.erros.data } : estado
  return (
    <form action={acao} className="flex max-w-md flex-wrap items-center justify-end gap-2">
      <div className="w-40">
        <Entrada type="date" name="data" defaultValue={estado.valores?.data ?? dia} max={dia} aria-label="Edição do dia" required />
      </div>
      <BotaoEnviar variante="secundario">Buscar no Diário</BotaoEnviar>
      {(mensagem.erro || mensagem.ok) && (
        <div className="basis-full">
          <MensagemFormulario estado={mensagem} />
        </div>
      )}
    </form>
  )
}

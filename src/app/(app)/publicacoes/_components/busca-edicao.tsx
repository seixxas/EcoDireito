'use client'

import { useActionState } from 'react'
import { BotaoEnviar } from '@/components/ui/botao-enviar'
import { Campo, Entrada, MensagemFormulario } from '@/components/ui/form'
import { buscarEdicao } from '../actions'

/** "Buscar agora": o mesmo que o robô agendado fará todo dia útil. Serve também para buscar dias que ficaram para trás. */
export function BuscaEdicao({ dia }: { dia: string }) {
  const [estado, acao] = useActionState(buscarEdicao, {})
  return (
    <form action={acao} className="flex max-w-md flex-wrap items-end gap-2">
      <Campo rotulo="Edição do dia" erro={estado.erros?.data}>
        <Entrada type="date" name="data" defaultValue={estado.valores?.data ?? dia} max={dia} required />
      </Campo>
      <BotaoEnviar>Buscar no Diário</BotaoEnviar>
      <div className="basis-full empty:hidden">
        <MensagemFormulario estado={estado} />
      </div>
    </form>
  )
}

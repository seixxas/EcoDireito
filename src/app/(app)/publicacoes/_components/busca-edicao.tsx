'use client'

import { useActionState } from 'react'
import { BotaoEnviar } from '@/components/ui/botao-enviar'
import { Campo, Entrada, MensagemFormulario } from '@/components/ui/form'
import { buscarEdicao } from '../actions'

/** "Buscar agora": o mesmo que o robô agendado fará todo dia útil. Serve também para buscar dias que ficaram para trás. */
export function BuscaEdicao({ dia }: { dia: string }) {
  const [estado, acao] = useActionState(buscarEdicao, {})
  // O erro do campo de data diz mais que o "Confira os campos destacados".
  const mensagem = estado.erros?.data ? { erro: estado.erros.data } : estado
  return (
    <form action={acao} className="flex max-w-md flex-wrap items-end gap-3">
      <Campo rotulo="Data da edição" className="w-55">
        <Entrada type="date" name="data" defaultValue={estado.valores?.data ?? dia} max={dia} required />
      </Campo>
      <BotaoEnviar variante="secundario" className="min-h-14">
        Buscar no Diário
      </BotaoEnviar>
      {(mensagem.erro || mensagem.ok) && (
        <div className="basis-full">
          <MensagemFormulario estado={mensagem} />
        </div>
      )}
    </form>
  )
}

'use client'

import { useActionState } from 'react'
import { BotaoEnviar } from '@/components/ui/botao-enviar'
import { Campo, Entrada, MensagemFormulario, Selecao } from '@/components/ui/form'
import { EVENTOS, FASES, TIPOS_EVENTO } from '@/domain/processos'
import { lancarEvento } from '../actions'

export function FormularioEvento({ processoId, dia }: { processoId: string; dia: string }) {
  const [estado, acao] = useActionState(lancarEvento, {})
  return (
    <form action={acao} className="space-y-3">
      <input type="hidden" name="processoId" value={processoId} />
      <Campo rotulo="O que aconteceu" erro={estado.erros?.tipo}>
        <Selecao name="tipo" defaultValue={estado.valores?.tipo ?? ''} required>
          <option value="" disabled>
            Escolha o evento
          </option>
          {FASES.map((fase) => (
            <optgroup key={fase.numero} label={`${fase.numero}. ${fase.nome}`}>
              {TIPOS_EVENTO.filter((tipo) => EVENTOS[tipo].fase === fase.numero).map((tipo) => (
                <option key={tipo} value={tipo}>
                  {EVENTOS[tipo].nome}
                </option>
              ))}
            </optgroup>
          ))}
        </Selecao>
      </Campo>
      <div className="grid gap-3 sm:grid-cols-2">
        <Campo rotulo="Data" erro={estado.erros?.data} dica="Se ainda vai acontecer, a data planejada.">
          <Entrada type="date" name="data" defaultValue={estado.valores?.data ?? dia} required />
        </Campo>
        <Campo rotulo="Prazo dado no ato (dias)" erro={estado.erros?.diasNoAto} dica="Só se for diferente do padrão.">
          <Entrada type="number" name="diasNoAto" defaultValue={estado.valores?.diasNoAto} min={1} inputMode="numeric" />
        </Campo>
      </div>
      <MensagemFormulario estado={estado} />
      <BotaoEnviar>Lançar evento</BotaoEnviar>
    </form>
  )
}

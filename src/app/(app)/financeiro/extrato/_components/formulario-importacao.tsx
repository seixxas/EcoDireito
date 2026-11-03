'use client'

import { useActionState } from 'react'
import { BotaoEnviar } from '@/components/ui/botao-enviar'
import { Entrada, MensagemFormulario } from '@/components/ui/form'
import { importarExtrato } from '../actions'

export function FormularioImportacao() {
  const [estado, acao] = useActionState(importarExtrato, {})
  return (
    <form action={acao} className="space-y-3">
      <div className="flex flex-wrap items-center gap-3">
        <label htmlFor="arquivo-extrato" className="font-medium text-ink">
          Importar extrato
        </label>
        <Entrada
          id="arquivo-extrato"
          name="arquivo"
          type="file"
          accept=".ofx,.csv,.txt"
          required
          className="w-auto min-w-64 flex-1 file:mr-3 file:rounded file:border-0 file:bg-brand-50 file:px-2 file:py-0.5 file:text-brand-700"
        />
        <BotaoEnviar>Importar</BotaoEnviar>
      </div>
      <p className="text-xs text-subtle">
        OFX (recomendado) ou CSV do banco. Importar o mesmo período de novo não duplica nada. Para testar:{' '}
        <a href="/financeiro/extrato/exemplo" download className="link">
          baixar extrato de exemplo
        </a>{' '}
        (montado com as notas e os lançamentos de hoje).
      </p>
      <MensagemFormulario estado={estado} />
    </form>
  )
}

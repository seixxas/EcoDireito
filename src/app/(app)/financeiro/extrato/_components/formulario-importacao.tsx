'use client'

import { useActionState, useState, type ReactNode } from 'react'
import { BotaoEnviar } from '@/components/ui/botao-enviar'
import { classeBotao, MensagemFormulario } from '@/components/ui/form'
import { importarExtrato } from '../actions'

function Passo({ numero, texto, children }: { numero: number; texto: string; children?: ReactNode }) {
  return (
    <li className="flex flex-col gap-2.5 rounded-lg bg-surface px-5 py-4.5">
      <b className="text-xs font-semibold text-subtle">Passo {numero}</b>
      <p>{texto}</p>
      {children}
    </li>
  )
}

export function FormularioImportacao() {
  const [estado, acao] = useActionState(importarExtrato, {})
  const [arquivo, setArquivo] = useState<string>()
  return (
    <form action={acao} onReset={() => setArquivo(undefined)} className="space-y-4">
      <ol className="grid gap-4 xl:grid-cols-3">
        <Passo numero={1} texto="Baixe o extrato no site do banco, em OFX (recomendado) ou CSV." />
        <Passo numero={2} texto="Escolha o arquivo no computador.">
          <label className={classeBotao('secundario', 'has-focus-visible:outline-3 has-focus-visible:outline-offset-2 has-focus-visible:outline-info')}>
            Escolher arquivo
            <input
              name="arquivo"
              type="file"
              accept=".ofx,.csv,.txt"
              required
              onChange={(evento) => setArquivo(evento.currentTarget.files?.[0]?.name)}
              className="sr-only"
            />
          </label>
          <span className="text-sm break-words text-muted">{arquivo ?? 'Nenhum arquivo escolhido'}</span>
        </Passo>
        <Passo numero={3} texto="Importe. Importar o mesmo período de novo não duplica nada.">
          <BotaoEnviar className="mt-auto min-h-14 text-[1.25rem]">Importar</BotaoEnviar>
        </Passo>
      </ol>
      <p className="text-sm text-muted">
        Para testar:{' '}
        <a href="/financeiro/extrato/exemplo" download className="link inline-flex min-h-12 items-center">
          baixar extrato de exemplo
        </a>{' '}
        (montado com as notas e os lançamentos de hoje).
      </p>
      <MensagemFormulario estado={estado} />
    </form>
  )
}

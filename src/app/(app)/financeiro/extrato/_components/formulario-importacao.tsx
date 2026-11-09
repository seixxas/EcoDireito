'use client'

import { useActionState, useState, type ReactNode } from 'react'
import { BotaoEnviar } from '@/components/ui/botao-enviar'
import { classeBotao, MensagemFormulario } from '@/components/ui/form'
import { importarExtrato } from '../actions'

function Passo({ numero, texto, children }: { numero: number; texto: string; children?: ReactNode }) {
  return (
    <li className="flex flex-col gap-2 rounded-lg bg-surface px-3 py-3">
      <b className="flex items-center gap-1.5 text-xs font-semibold text-subtle">
        <span aria-hidden className="copa inline-flex size-5 items-center justify-center rounded-full text-2xs text-white">
          {numero}
        </span>
        Passo {numero}
      </b>
      <p>{texto}</p>
      {children}
    </li>
  )
}

export function FormularioImportacao() {
  const [estado, acao] = useActionState(importarExtrato, {})
  const [arquivo, setArquivo] = useState<string>()
  return (
    <form action={acao} onReset={() => setArquivo(undefined)} className="space-y-3">
      <ol className="grid gap-3 xl:grid-cols-3">
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
          <BotaoEnviar className="mt-auto ">Importar</BotaoEnviar>
        </Passo>
      </ol>
      <p className="text-xs text-muted">
        Para testar:{' '}
        <a href="/financeiro/extrato/exemplo" download className="link">
          baixar extrato de exemplo
        </a>{' '}
        (montado com as notas e os lançamentos de hoje).
      </p>
      <MensagemFormulario estado={estado} />
    </form>
  )
}

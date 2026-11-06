'use client'

import Form from 'next/form'
import { SelecaoConta } from './selecao-conta'

/** Filtro de conta na URL (`?conta=`), como a `Busca`: escolher já filtra e volta para a página 1. */
export function FiltroConta({ acao, valor, manter }: { acao: string; valor?: string; manter: Record<string, string | undefined> }) {
  return (
    <Form action={acao} scroll={false} className="w-full sm:w-auto">
      {Object.entries(manter).map(([nome, v]) => v && <input key={nome} type="hidden" name={nome} value={v} />)}
      <label htmlFor="filtro-conta" className="mb-2 block text-base font-medium text-ink">
        Conta
      </label>
      <SelecaoConta
        key={valor}
        id="filtro-conta"
        name="conta"
        vazia="Todas as contas"
        defaultValue={valor ?? ''}
        onChange={(evento) => evento.currentTarget.form?.requestSubmit()}
        className="sm:w-65"
      />
    </Form>
  )
}

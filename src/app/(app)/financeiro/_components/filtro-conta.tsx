'use client'

import { SelecaoConta } from './selecao-conta'

/** Filtro de conta na URL (`?conta=`). Formulário GET como a `Busca`: escolher já filtra e volta para a página 1. */
export function FiltroConta({ valor, manter }: { valor?: string; manter: Record<string, string | undefined> }) {
  return (
    <form method="get">
      {Object.entries(manter).map(([nome, v]) => v && <input key={nome} type="hidden" name={nome} value={v} />)}
      <label htmlFor="filtro-conta" className="sr-only">
        Conta
      </label>
      <SelecaoConta
        id="filtro-conta"
        name="conta"
        vazia="Todas as contas"
        defaultValue={valor ?? ''}
        onChange={(evento) => evento.currentTarget.form?.requestSubmit()}
        className="h-9 w-auto max-w-64"
      />
    </form>
  )
}

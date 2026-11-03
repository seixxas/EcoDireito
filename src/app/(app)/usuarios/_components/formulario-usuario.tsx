'use client'

import { useActionState, useState } from 'react'
import { BotaoEnviar } from '@/components/ui/botao-enviar'
import { Campo, Entrada, MensagemFormulario, Selecao } from '@/components/ui/form'
import { PAPEIS, type Papel } from '@/lib/permissoes'
import { adicionarUsuario } from '../actions'

export function FormularioUsuario({ clientes }: { clientes: { id: string; nome: string }[] }) {
  const [estado, acao] = useActionState(adicionarUsuario, {})
  const [papel, setPapel] = useState<Papel>('equipe')

  return (
    <form action={acao} className="grid gap-4 sm:grid-cols-2">
      <Campo rotulo="Nome" erro={estado.erros?.nome}>
        <Entrada name="nome" required />
      </Campo>
      <Campo rotulo="E-mail" erro={estado.erros?.email}>
        <Entrada name="email" type="email" required />
      </Campo>
      <Campo rotulo="Perfil" erro={estado.erros?.papel}>
        <Selecao name="papel" value={papel} onChange={(e) => setPapel(e.target.value as Papel)}>
          {Object.entries(PAPEIS).map(([valor, { nome }]) => (
            <option key={valor} value={valor}>
              {nome}
            </option>
          ))}
        </Selecao>
      </Campo>
      {papel === 'cliente' ? (
        <Campo rotulo="Cliente" erro={estado.erros?.clienteId} dica="Ele verá só os processos deste cliente">
          <Selecao name="clienteId" defaultValue="">
            <option value="" disabled>
              Escolha…
            </option>
            {clientes.map((cliente) => (
              <option key={cliente.id} value={cliente.id}>
                {cliente.nome}
              </option>
            ))}
          </Selecao>
        </Campo>
      ) : (
        <div />
      )}
      <Campo rotulo="Senha inicial" erro={estado.erros?.senha} dica="Mínimo de 8 caracteres. Passe para a pessoa por um canal seguro.">
        <Entrada name="senha" type="password" autoComplete="new-password" required />
      </Campo>
      <div className="flex items-end">
        <BotaoEnviar>Criar acesso</BotaoEnviar>
      </div>
      <div className="sm:col-span-2">
        <MensagemFormulario estado={estado} />
      </div>
    </form>
  )
}

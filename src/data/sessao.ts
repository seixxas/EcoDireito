import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { temBanco } from '@/db'
import { auth } from '@/lib/auth'
import { ehPapel, inicioDoPapel, pode, type Acesso, type Area, type Papel } from '@/lib/permissoes'
import { guardarNaTela } from './telas'

export type Usuario = { id: string; nome: string; email: string; papel: Papel; clienteId?: string }

/** Sem banco não há login: todo mundo entra como sócia de demonstração. */
const USUARIO_SEM_BANCO: Usuario = { id: 'demo', nome: 'Elaine', email: 'demo@local', papel: 'socia' }

/** Usuário logado (uma leitura por requisição) ou undefined. Fica só no navegador de quem entrou, nunca no servidor. */
export async function usuarioAtual(): Promise<Usuario | undefined> {
  'use cache: private'
  guardarNaTela()
  if (!temBanco) return USUARIO_SEM_BANCO
  const sessao = await auth.api.getSession({ headers: await headers() })
  if (!sessao) return undefined
  const { user } = sessao
  return {
    id: user.id,
    nome: user.name,
    email: user.email,
    papel: ehPapel(user.papel) ? user.papel : 'equipe',
    clienteId: user.clienteId ?? undefined,
  }
}

export async function exigirUsuario() {
  const usuario = await usuarioAtual()
  if (!usuario) redirect('/login')
  return usuario
}

/** Use em páginas e em toda Server Action que grava: `await exigirArea('financeiro', 'editar')`. */
export async function exigirArea(area: Area, acesso: Acesso = 'ver') {
  const usuario = await exigirUsuario()
  if (!pode(usuario.papel, area, acesso)) redirect(inicioDoPapel(usuario.papel))
  return usuario
}

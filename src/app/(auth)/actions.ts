'use server'

import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import { auth } from '@/lib/auth'
import { campo, lerFormulario, type EstadoFormulario } from '@/lib/formulario'
import { caminhoInterno, ehPapel, inicioDoPapel } from '@/lib/permissoes'

const esquema = z.object({
  email: z.email('E-mail inválido'),
  senha: campo.texto('Digite a senha'),
  voltar: campo.opcional(),
})

export async function entrar(_: EstadoFormulario, formData: FormData): Promise<EstadoFormulario> {
  const lido = lerFormulario(esquema, formData)
  if ('estado' in lido) return lido.estado
  const { email, senha, voltar } = lido.dados

  let destino: string
  try {
    const { user } = await auth.api.signInEmail({ body: { email, password: senha }, headers: await headers() })
    destino = voltar && caminhoInterno(voltar) ? voltar : inicioDoPapel(ehPapel(user.papel) ? user.papel : 'equipe')
  } catch {
    return { erro: 'E-mail ou senha incorretos.', valores: { email } }
  }
  redirect(destino)
}

export async function sair() {
  await auth.api.signOut({ headers: await headers() })
  redirect('/login')
}

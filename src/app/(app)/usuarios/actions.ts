'use server'

import { z } from 'zod'
import { atualizarTelas } from '@/data/telas'
import { exigirArea } from '@/data/sessao'
import { criarUsuario, removerUsuario } from '@/data/usuarios'
import { campo, lerFormulario, valoresDoFormulario, type EstadoFormulario } from '@/lib/formulario'
import { PAPEIS, type Papel } from '@/lib/permissoes'

const esquema = z
  .object({
    nome: campo.texto('Digite o nome'),
    email: z.email('E-mail inválido'),
    papel: z.enum(Object.keys(PAPEIS) as [Papel, ...Papel[]], 'Escolha o perfil'),
    clienteId: campo.opcional(),
    senha: z.string().min(8, 'A senha precisa de pelo menos 8 caracteres'),
  })
  .refine((dados) => dados.papel !== 'cliente' || dados.clienteId, { path: ['clienteId'], message: 'Escolha o cliente' })

export async function adicionarUsuario(_: EstadoFormulario, formData: FormData): Promise<EstadoFormulario> {
  await exigirArea('usuarios', 'editar')
  const lido = lerFormulario(esquema, formData)
  if ('estado' in lido) return lido.estado
  const { clienteId, ...dados } = lido.dados
  const resultado = await criarUsuario({ ...dados, clienteId: dados.papel === 'cliente' ? clienteId : undefined })
  if (resultado.erro) return { erro: resultado.erro, valores: valoresDoFormulario(formData) }
  atualizarTelas()
  return { ok: `${dados.nome} já pode entrar com ${dados.email}.` }
}

export async function excluirUsuario(formData: FormData) {
  const usuario = await exigirArea('usuarios', 'editar')
  const id = String(formData.get('id'))
  if (id !== usuario.id) await removerUsuario(id)
  atualizarTelas()
}

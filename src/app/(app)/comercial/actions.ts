'use server'

import { redirect } from 'next/navigation'
import { z } from 'zod'
import { atualizarTelas } from '@/data/telas'
import { alterarProposta, gravarProposta } from '@/data/processos'
import { exigirArea } from '@/data/sessao'
import { campo, lerFormulario, type EstadoFormulario } from '@/lib/formulario'

const validade = () => z.coerce.number().int('Use um número de dias').min(1, 'Pelo menos 1 dia').max(365, 'No máximo 365 dias')

const esquemaProposta = z.object({
  clienteId: campo.texto('Escolha o cliente'),
  empreendimento: campo.texto(),
  endereco: z.string().trim(),
  responsavel: z.string().trim(),
  servico: z.enum(['licenciamento', 'manejo']),
  valor: campo.dinheiro().refine((v) => v > 0, 'Informe o valor da proposta'),
  escopo: campo.texto('Descreva o que será feito'),
  validadeDias: validade(),
})

/** Cria a proposta: o processo entra na fase 1 e o contrato já nasce com as parcelas do serviço. */
export async function criarProposta(_: EstadoFormulario, formData: FormData): Promise<EstadoFormulario> {
  await exigirArea('comercial', 'editar')
  const lido = lerFormulario(esquemaProposta, formData)
  if ('estado' in lido) return lido.estado
  const id = await gravarProposta(lido.dados)
  atualizarTelas()
  redirect(`/processos/${id}?aba=proposta`)
}

const esquemaTexto = z.object({ processoId: campo.texto(), escopo: campo.texto('Descreva o que será feito'), validadeDias: validade() })

export async function salvarTextoDaProposta(_: EstadoFormulario, formData: FormData): Promise<EstadoFormulario> {
  await exigirArea('comercial', 'editar')
  const lido = lerFormulario(esquemaTexto, formData)
  if ('estado' in lido) return lido.estado
  const { processoId, ...dados } = lido.dados
  await alterarProposta(processoId, dados)
  atualizarTelas()
  return { ok: 'Proposta salva.' }
}

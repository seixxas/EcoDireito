'use server'

import { redirect } from 'next/navigation'
import { z } from 'zod'
import { atualizarTelas } from '@/data/telas'
import { alterarProposta, gravarEvento, gravarProposta, obterProcesso } from '@/data/processos'
import { hoje } from '@/data/hoje'
import { exigirArea } from '@/data/sessao'
import { ESTADOS_PROPOSTA, etapaParaMover, situacaoDaProposta, type EstadoProposta } from '@/domain/propostas'
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
  redirect(`/projetos/${id}?aba=proposta`)
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

/** Arrastou o cartão para outra coluna: marca a etapa com a data de hoje, como o botão da proposta faz. */
export async function moverProposta(processoId: string, para: EstadoProposta, observacao?: string): Promise<{ erro?: string }> {
  await exigirArea('prazos', 'editar')
  const [dados, dia] = await Promise.all([obterProcesso(processoId), hoje()])
  if (!dados) return { erro: 'Proposta não encontrada.' }
  const de = situacaoDaProposta(dados.processo, dia).estado
  const tipo = etapaParaMover(de, para)
  if (!tipo) return { erro: `Uma proposta ${ESTADOS_PROPOSTA[de].toLowerCase()} não passa direto para ${ESTADOS_PROPOSTA[para].toLowerCase()}.` }
  await gravarEvento(dados.processo, { tipo, data: dia, origem: 'manual', observacao: observacao?.trim() || undefined })
  atualizarTelas()
  return {}
}

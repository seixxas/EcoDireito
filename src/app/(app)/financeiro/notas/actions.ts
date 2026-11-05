'use server'

import { redirect } from 'next/navigation'
import { z } from 'zod'
import { atualizarTelas } from '@/data/telas'
import { dadosParaNovaNota, gravarCancelamento, gravarNota, gravarRecebimento, obterNota } from '@/data/financeiro'
import { exigirArea } from '@/data/sessao'
import { errosDaNota, errosDoRecebimento, montarNota, motivoParaNaoCancelar } from '@/domain/financeiro/notas'
import { campo, lerFormulario, valoresDoFormulario, type EstadoFormulario } from '@/lib/formulario'

const esquemaNota = z.object({
  numero: campo.inteiro().positive('Informe o número da NF'),
  emissao: campo.data(),
  clienteId: campo.texto('Escolha o cliente'),
  processoId: campo.opcional(),
  /** Só existe no formulário que vem de uma parcela. */
  parcelaId: campo.opcional().optional(),
  descricao: campo.texto('Descreva o serviço'),
  valor: campo.dinheiro(),
  previsao: campo.data(),
  comRetencao: z
    .string()
    .optional()
    .transform((marcado) => marcado === 'on'),
})

export async function registrarNota(_: EstadoFormulario, formData: FormData): Promise<EstadoFormulario> {
  await exigirArea('financeiro', 'editar')
  const lido = lerFormulario(esquemaNota, formData)
  if ('estado' in lido) return lido.estado

  const { notas, processos } = await dadosParaNovaNota()
  const nota = montarNota(crypto.randomUUID(), lido.dados)
  const erros = errosDaNota(nota, notas, processos.find((p) => p.id === nota.processoId))
  if (Object.keys(erros).length) return { erro: 'Confira os campos destacados.', erros, valores: valoresDoFormulario(formData) }

  await gravarNota(nota)
  atualizarTelas()
  redirect(`/financeiro/notas/${nota.id}`)
}

const esquemaRecebimento = z.object({ notaId: campo.texto(), data: campo.data(), valor: campo.dinheiro() })

export async function registrarRecebimento(_: EstadoFormulario, formData: FormData): Promise<EstadoFormulario> {
  await exigirArea('financeiro', 'editar')
  const lido = lerFormulario(esquemaRecebimento, formData)
  if ('estado' in lido) return lido.estado

  const { notaId, ...recebimento } = lido.dados
  const dados = await obterNota(notaId)
  if (!dados || dados.nota.cancelada) return { erro: 'Nota cancelada não recebe pagamento.' }
  const erros = errosDoRecebimento(dados.nota, recebimento, dados.hoje)
  if (Object.keys(erros).length) return { erro: 'Confira os campos destacados.', erros, valores: valoresDoFormulario(formData) }

  await gravarRecebimento(dados.nota, dados.cliente, recebimento)
  atualizarTelas()
  return { ok: 'Recebimento registrado. A receita entrou nos lançamentos.' }
}

export async function cancelarNota(_: EstadoFormulario, formData: FormData): Promise<EstadoFormulario> {
  await exigirArea('financeiro', 'editar')
  const dados = await obterNota(String(formData.get('notaId')))
  if (!dados) return { erro: 'Nota não encontrada.' }
  const motivo = motivoParaNaoCancelar(dados.nota)
  if (motivo) return { erro: motivo }

  await gravarCancelamento(dados.nota.id)
  atualizarTelas()
  return { ok: 'Nota cancelada.' }
}

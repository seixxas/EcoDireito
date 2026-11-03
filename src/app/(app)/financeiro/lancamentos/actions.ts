'use server'

import { refresh } from 'next/cache'
import { z } from 'zod'
import { apagarLancamento, gravarLancamento } from '@/data/financeiro'
import { hoje } from '@/data/hoje'
import { exigirArea } from '@/data/sessao'
import { errosDoLancamento } from '@/domain/financeiro/lancamentos'
import { CONTAS, type ContaId } from '@/domain/financeiro/plano-de-contas'
import { mesDe } from '@/lib/datas'
import { campo, lerFormulario, valoresDoFormulario, type EstadoFormulario } from '@/lib/formulario'

const esquema = z.object({
  sentido: z.enum(['saida', 'entrada']),
  data: campo.data(),
  /** Vazio = o mês da data. */
  competencia: z.string().regex(/^(\d{4}-\d{2})?$/, 'Mês inválido'),
  descricao: campo.texto('Descreva o lançamento'),
  contaId: z.enum(CONTAS.map((c) => c.id) as [ContaId, ...ContaId[]], 'Escolha a conta'),
  valor: campo.dinheiro(),
  processoId: campo.opcional(),
})

export async function registrarLancamento(_: EstadoFormulario, formData: FormData): Promise<EstadoFormulario> {
  await exigirArea('financeiro', 'editar')
  const lido = lerFormulario(esquema, formData)
  if ('estado' in lido) return lido.estado

  const { sentido, valor, competencia, ...dados } = lido.dados
  const lancamento = { ...dados, competencia: competencia || mesDe(dados.data), valor: sentido === 'saida' ? -Math.abs(valor) : Math.abs(valor) }
  const erros = errosDoLancamento(lancamento, await hoje())
  if (Object.keys(erros).length) return { erro: 'Confira os campos destacados.', erros, valores: valoresDoFormulario(formData) }

  await gravarLancamento(lancamento)
  refresh()
  return { ok: 'Lançamento registrado.' }
}

export async function excluirLancamento(formData: FormData) {
  await exigirArea('financeiro', 'editar')
  await apagarLancamento(String(formData.get('id')))
  refresh()
}

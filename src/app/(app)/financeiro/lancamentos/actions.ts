'use server'

import { redirect } from 'next/navigation'
import { z } from 'zod'
import { atualizarTelas } from '@/data/telas'
import { alterarLancamento, apagarLancamento, gravarLancamento, obterLancamento } from '@/data/financeiro'
import { hoje } from '@/data/hoje'
import { exigirArea } from '@/data/sessao'
import { alteracoesDoLancamento, errosDoLancamento } from '@/domain/financeiro/lancamentos'
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
  observacao: campo.opcional(),
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
  atualizarTelas()
  return { ok: 'Lançamento registrado.' }
}

/** Data e valor não mudam na edição; o lançamento de uma nota só aceita a observação. */
const esquemaEdicao = esquema.pick({ competencia: true, descricao: true, contaId: true, processoId: true, observacao: true })
const esquemaObservacao = esquema.pick({ observacao: true })

export async function editarLancamento(_: EstadoFormulario, formData: FormData): Promise<EstadoFormulario> {
  await exigirArea('financeiro', 'editar')
  const dados = await obterLancamento(String(formData.get('id')))
  if (!dados) return { erro: 'Lançamento não encontrado.' }
  const { lancamento } = dados
  const lido = lerFormulario(lancamento.notaId ? esquemaObservacao : esquemaEdicao, formData)
  if ('estado' in lido) return lido.estado

  await alterarLancamento(lancamento.id, alteracoesDoLancamento(lancamento, { ...lancamento, ...lido.dados }))
  atualizarTelas()
  return { ok: 'Alterações salvas.' }
}

/** Da tela do lançamento, volta para a lista (`voltar`); da lista, só atualiza. */
export async function excluirLancamento(formData: FormData) {
  await exigirArea('financeiro', 'editar')
  await apagarLancamento(String(formData.get('id')))
  const voltar = String(formData.get('voltar') ?? '')
  atualizarTelas()
  if (voltar.startsWith('/financeiro/lancamentos')) redirect(voltar)
}

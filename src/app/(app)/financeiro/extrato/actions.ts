'use server'

import { refresh } from 'next/cache'
import { z } from 'zod'
import {
  aplicarSugestoes,
  apagarRegra,
  filaDoExtrato,
  gravarLinhasExtrato,
  gravarRegra,
  ignorarLinhaExtrato,
  lancarLinhaExtrato,
  receberPelaLinhaExtrato,
} from '@/data/financeiro'
import { exigirArea } from '@/data/sessao'
import { chaveDaSugestao } from '@/domain/financeiro/classificacao'
import { decodificar, lerExtrato } from '@/domain/financeiro/extrato'
import { errosDoRecebimento } from '@/domain/financeiro/notas'
import { CONTAS, type ContaId } from '@/domain/financeiro/plano-de-contas'
import { campo, lerFormulario, valoresDoFormulario, type EstadoFormulario } from '@/lib/formulario'

const contaId = z.enum(CONTAS.map((c) => c.id) as [ContaId, ...ContaId[]], 'Escolha a conta')

export async function importarExtrato(_: EstadoFormulario, formData: FormData): Promise<EstadoFormulario> {
  await exigirArea('financeiro', 'editar')
  const arquivo = formData.get('arquivo')
  if (!(arquivo instanceof File) || !arquivo.size) return { erro: 'Escolha o arquivo do extrato.' }

  const leitura = lerExtrato(decodificar(new Uint8Array(await arquivo.arrayBuffer())))
  if ('erro' in leitura) return { erro: leitura.erro }
  const novas = await gravarLinhasExtrato(leitura.linhas, arquivo.name)
  const repetidas = leitura.linhas.length - novas
  refresh()
  return { ok: `${novas} ${novas === 1 ? 'linha nova' : 'linhas novas'} na fila.${repetidas ? ` ${repetidas} já tinham sido importadas.` : ''}` }
}

async function itemDaFila(linhaId: string) {
  const fila = await filaDoExtrato()
  return { fila, item: fila.pendentes.find((p) => p.linha.id === linhaId) }
}

/** Só aplica se a sugestão ainda for a que estava na tela; se mudou, a tela atualiza e mostra a nova. */
export async function confirmarSugestao(formData: FormData) {
  await exigirArea('financeiro', 'editar')
  const { fila, item } = await itemDaFila(String(formData.get('linhaId')))
  if (item?.sugestao && chaveDaSugestao(item.sugestao) === formData.get('sugestao')) {
    await aplicarSugestoes([{ linha: item.linha, sugestao: item.sugestao }], fila.clientes)
  }
  refresh()
}

/**
 * Confirma as sugestões que estavam na tela (com a busca, só as encontradas). Cada `item` é "linhaId chave":
 * a linha cuja sugestão mudou desde então fica para a próxima, como no "Confirmar" de uma linha.
 */
export async function confirmarTodas(formData: FormData) {
  await exigirArea('financeiro', 'editar')
  const naTela = new Set(formData.getAll('item').map(String))
  const fila = await filaDoExtrato()
  await aplicarSugestoes(
    fila.pendentes.flatMap(({ linha, sugestao }) => (sugestao && naTela.has(`${linha.id} ${chaveDaSugestao(sugestao)}`) ? [{ linha, sugestao }] : [])),
    fila.clientes,
  )
  refresh()
}

const esquemaClassificacao = z.object({
  linhaId: campo.texto(),
  /** Só aparece em linha de crédito. */
  notaId: campo.opcional().optional(),
  contaId: z.union([z.literal(''), contaId]).transform((valor) => valor || undefined),
  processoId: campo.opcional(),
  lembrar: z
    .string()
    .optional()
    .transform((marcado) => marcado === 'on'),
  termo: campo.opcional(),
})

/** Lança a linha numa conta (e pode criar a regra) ou a liga ao recebimento de uma nota. */
export async function classificarLinha(_: EstadoFormulario, formData: FormData): Promise<EstadoFormulario> {
  await exigirArea('financeiro', 'editar')
  const lido = lerFormulario(esquemaClassificacao, formData)
  if ('estado' in lido) return lido.estado
  const { linhaId, notaId, contaId, processoId, lembrar, termo } = lido.dados
  const { fila, item } = await itemDaFila(linhaId)
  if (!item) return { erro: 'Esta linha já saiu da fila.' }
  const comErro = (erros: Record<string, string>) => ({ erro: 'Confira os campos destacados.', erros, valores: valoresDoFormulario(formData) })

  if (notaId) {
    const nota = fila.notas.find((n) => n.id === notaId && !n.cancelada && !n.recebimento)
    if (!nota) return comErro({ notaId: 'Esta nota não está mais a receber' })
    const erros = errosDoRecebimento(nota, { data: item.linha.data, valor: item.linha.valor }, fila.hoje)
    if (Object.keys(erros).length) return comErro({ notaId: Object.values(erros)[0] })
    if (!(await receberPelaLinhaExtrato(item.linha, nota, fila.clientes.find((c) => c.id === nota.clienteId)!))) return JA_LANCADA
  } else {
    if (!contaId) return comErro({ contaId: 'Escolha a conta ou a nota' })
    if (lembrar && (termo ?? '').length < 3) return comErro({ termo: 'Use pelo menos 3 letras' })
    if (!(await lancarLinhaExtrato(item.linha, { contaId, processoId }))) return JA_LANCADA
    if (lembrar && termo) await gravarRegra({ contem: termo, contaId, processoId })
  }
  refresh()
  return { ok: 'Lançado.' }
}

const JA_LANCADA: EstadoFormulario = { erro: 'Esta linha acabou de ser lançada por outra confirmação. Nada foi gravado em dobro.' }

export async function ignorarLinha(formData: FormData) {
  await exigirArea('financeiro', 'editar')
  await ignorarLinhaExtrato(String(formData.get('linhaId')), true)
  refresh()
}

export async function devolverLinha(formData: FormData) {
  await exigirArea('financeiro', 'editar')
  await ignorarLinhaExtrato(String(formData.get('linhaId')), false)
  refresh()
}

const esquemaRegra = z.object({
  contem: campo.texto('Escreva o trecho').min(3, 'Use pelo menos 3 letras'),
  contaId,
  processoId: campo.opcional(),
})

export async function criarRegra(_: EstadoFormulario, formData: FormData): Promise<EstadoFormulario> {
  await exigirArea('financeiro', 'editar')
  const lido = lerFormulario(esquemaRegra, formData)
  if ('estado' in lido) return lido.estado
  await gravarRegra(lido.dados)
  refresh()
  return { ok: 'Regra salva. As linhas da fila que batem com ela já aparecem com a sugestão.' }
}

export async function excluirRegra(formData: FormData) {
  await exigirArea('financeiro', 'editar')
  await apagarRegra(String(formData.get('id')))
  refresh()
}

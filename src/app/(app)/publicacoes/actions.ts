'use server'

import { z } from 'zod'
import { atualizarTelas } from '@/data/telas'
import { hoje } from '@/data/hoje'
import { gravarConfirmacao, gravarDescarte, importarEdicao, obterPublicacao } from '@/data/publicacoes'
import { exigirArea } from '@/data/sessao'
import { formatarData } from '@/lib/formatar'
import { campo, lerFormulario, type EstadoFormulario } from '@/lib/formulario'

/** Lança o ato no processo: marca a etapa que ele sugere ou, se a série não vira etapa, só registra que foi visto. */
export async function lancarAto(_: EstadoFormulario, formData: FormData): Promise<EstadoFormulario> {
  await exigirArea('prazos', 'editar')
  const lido = lerFormulario(z.object({ id: campo.texto() }), formData)
  if ('estado' in lido) return lido.estado
  const item = await obterPublicacao(lido.dados.id)
  if (!item || item.ato.status !== 'nova') return { erro: 'Este ato já foi revisado.' }
  if (!item.processo) return { erro: 'Cadastre o projeto antes de lançar.' }
  await gravarConfirmacao({ ...item, processo: item.processo })
  atualizarTelas()
  return {}
}

export async function buscarEdicao(_: EstadoFormulario, formData: FormData): Promise<EstadoFormulario> {
  await exigirArea('prazos', 'editar')
  const lido = lerFormulario(z.object({ data: campo.data() }), formData)
  if ('estado' in lido) return lido.estado
  const { data } = lido.dados
  if (data > (await hoje())) return { erro: 'Confira os campos destacados.', erros: { data: 'A edição deste dia ainda não saiu' }, valores: { data } }
  let resultado: Awaited<ReturnType<typeof importarEdicao>>
  try {
    resultado = await importarEdicao(data)
  } catch (erro) {
    return { erro: erro instanceof Error ? erro.message : 'Não foi possível ler o Diário Oficial.', valores: { data } }
  }
  atualizarTelas()
  if (!resultado) return { ok: `Não houve edição em ${formatarData(data)} (fim de semana, feriado ou ponto facultativo).`, valores: { data } }
  const { atosSvma, novos } = resultado
  return { ok: `Edição de ${formatarData(data)}: ${atosSvma} atos da Secretaria do Verde, ${novos === 1 ? '1 novo' : `${novos} novos`} para revisar.`, valores: { data } }
}

/** `motivo` vem da lista (`MOTIVOS_PARA_IGNORAR`); "outro" usa o que foi escrito. */
const esquemaIgnorar = z
  .object({ id: campo.texto(), motivo: campo.texto('Escolha o motivo'), outro: campo.opcional() })
  .refine((dados) => dados.motivo !== 'outro' || dados.outro, { path: ['outro'], message: 'Escreva o motivo' })

export async function ignorarAto(_: EstadoFormulario, formData: FormData): Promise<EstadoFormulario> {
  await exigirArea('prazos', 'editar')
  const lido = lerFormulario(esquemaIgnorar, formData)
  if ('estado' in lido) return lido.estado
  const { id, motivo, outro } = lido.dados
  await gravarDescarte(id, motivo === 'outro' && outro ? outro : motivo)
  atualizarTelas()
  return {}
}

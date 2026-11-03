'use server'

import { refresh } from 'next/cache'
import { z } from 'zod'
import { gravarConfirmacao, gravarDescarte, importarEdicao, obterPublicacao } from '@/data/publicacoes'
import { exigirArea } from '@/data/sessao'
import { formatarData } from '@/lib/formatar'
import { campo, lerFormulario, type EstadoFormulario } from '@/lib/formulario'

export async function confirmarAto(_: EstadoFormulario, formData: FormData): Promise<EstadoFormulario> {
  await exigirArea('prazos', 'editar')
  const lido = lerFormulario(z.object({ id: campo.texto() }), formData)
  if ('estado' in lido) return lido.estado
  const item = await obterPublicacao(lido.dados.id)
  if (!item || item.ato.status !== 'nova') return { erro: 'Este ato já foi revisado.' }
  if (!item.processo) return { erro: 'Cadastre o processo antes de confirmar.' }
  await gravarConfirmacao({ ...item, processo: item.processo })
  refresh()
  return {}
}

export async function buscarEdicao(_: EstadoFormulario, formData: FormData): Promise<EstadoFormulario> {
  await exigirArea('prazos', 'editar')
  const lido = lerFormulario(z.object({ data: campo.data() }), formData)
  if ('estado' in lido) return lido.estado
  const { data } = lido.dados
  let resultado: Awaited<ReturnType<typeof importarEdicao>>
  try {
    resultado = await importarEdicao(data)
  } catch (erro) {
    return { erro: erro instanceof Error ? erro.message : 'Não foi possível ler o Diário Oficial.', valores: { data } }
  }
  refresh()
  if (!resultado) return { ok: `Não houve edição em ${formatarData(data)} (fim de semana, feriado ou ponto facultativo).`, valores: { data } }
  const { atosSvma, novos } = resultado
  return { ok: `Edição de ${formatarData(data)}: ${atosSvma} atos da Secretaria do Verde, ${novos === 1 ? '1 novo' : `${novos} novos`} para revisar.`, valores: { data } }
}

const esquemaDescarte = z.object({ id: campo.texto(), motivo: campo.texto('Diga por que o ato não é nosso') })

export async function descartarAto(_: EstadoFormulario, formData: FormData): Promise<EstadoFormulario> {
  await exigirArea('prazos', 'editar')
  const lido = lerFormulario(esquemaDescarte, formData)
  if ('estado' in lido) return lido.estado
  await gravarDescarte(lido.dados.id, lido.dados.motivo)
  refresh()
  return {}
}

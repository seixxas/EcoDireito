'use server'

import { refresh } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import { gravarCliente, gravarEvento, gravarProcesso, obterProcesso, removerEvento, seiEmUso } from '@/data/processos'
import { exigirArea } from '@/data/sessao'
import { EVENTOS, FASES, TIPOS_EVENTO, type NumeroFase } from '@/domain/processos'
import { campo, lerFormulario, valoresDoFormulario, type EstadoFormulario } from '@/lib/formulario'
import { caminhoInterno } from '@/lib/permissoes'

const destino = (voltar: string | undefined, padrao: string) => (voltar && caminhoInterno(voltar) ? voltar : padrao)

const esquemaCliente = z.object({
  id: campo.opcional(),
  nome: campo.texto(),
  documento: campo.texto().refine((v) => [11, 14].includes(v.replace(/\D/g, '').length), 'CNPJ com 14 dígitos ou CPF com 11'),
  grupo: campo.opcional(),
  voltar: campo.opcional(),
})

export async function salvarCliente(_: EstadoFormulario, formData: FormData): Promise<EstadoFormulario> {
  await exigirArea('prazos', 'editar')
  const lido = lerFormulario(esquemaCliente, formData)
  if ('estado' in lido) return lido.estado
  const { id, voltar, ...dados } = lido.dados
  await gravarCliente(dados, id)
  redirect(destino(voltar, '/processos/clientes'))
}

const esquemaProcesso = z.object({
  id: campo.opcional(),
  clienteId: campo.texto('Escolha o cliente'),
  empreendimento: campo.texto(),
  endereco: z.string().trim(),
  responsavel: z.string().trim(),
  servico: z.enum(['licenciamento', 'manejo']),
  numeroSei: campo.texto().regex(/^\d{4}\.\d{4}\/\d{7}-\d$/, 'Use o formato 6027.2026/0000021-3'),
  numeroSimproc: campo.opcional().refine((v) => !v || /^\d{4}-0\.\d{3}\.\d{3}-\d$/.test(v), 'Use o formato 2016-0.084.512-3'),
  numeroTca: campo.opcional(),
  faseAtual: z.coerce
    .number()
    .int()
    .min(1)
    .max(FASES.length)
    .transform((n) => n as NumeroFase),
  voltar: campo.opcional(),
})

export async function salvarProcesso(_: EstadoFormulario, formData: FormData): Promise<EstadoFormulario> {
  await exigirArea('prazos', 'editar')
  const lido = lerFormulario(esquemaProcesso, formData)
  if ('estado' in lido) return lido.estado
  const { id, voltar, ...dados } = lido.dados
  if (await seiEmUso(dados.numeroSei, id)) {
    return { erro: 'Confira os campos destacados.', erros: { numeroSei: 'Já existe um processo com este nº SEI' }, valores: valoresDoFormulario(formData) }
  }
  const gravado = await gravarProcesso(dados, id)
  redirect(destino(voltar, `/processos/${gravado}`))
}

const esquemaEvento = z.object({
  processoId: campo.texto(),
  tipo: z.enum(TIPOS_EVENTO, { error: 'Escolha o evento' }),
  data: campo.data(),
  diasNoAto: campo
    .opcional()
    .refine((v) => !v || /^\d+$/.test(v), 'Use um número de dias')
    .transform((v) => (v ? Number(v) : undefined)),
})

export async function lancarEvento(_: EstadoFormulario, formData: FormData): Promise<EstadoFormulario> {
  await exigirArea('prazos', 'editar')
  const lido = lerFormulario(esquemaEvento, formData)
  if ('estado' in lido) return lido.estado
  const { processoId, ...evento } = lido.dados
  const dados = await obterProcesso(processoId)
  if (!dados) return { erro: 'Processo não encontrado.' }
  await gravarEvento(dados.processo, { ...evento, origem: 'manual' })
  refresh()
  return { ok: `${EVENTOS[evento.tipo].nome}: lançado.` }
}

export async function apagarEvento(id: string) {
  await exigirArea('prazos', 'editar')
  await removerEvento(id)
  refresh()
}

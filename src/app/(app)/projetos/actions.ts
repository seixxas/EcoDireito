'use server'

import { redirect } from 'next/navigation'
import { z } from 'zod'
import { atualizarTelas } from '@/data/telas'
import { gravarCliente, gravarEvento, gravarProcesso, obterProcesso, removerEvento, seiEmUso } from '@/data/processos'
import { hoje } from '@/data/hoje'
import { lancarNoProcessoNovo } from '@/data/publicacoes'
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
  const gravado = await gravarCliente(dados, id)
  atualizarTelas()
  // Cliente novo criado no meio de uma proposta (ou processo): volta para lá com ele já escolhido.
  const volta = destino(voltar, '/projetos/clientes')
  redirect(!id && voltar && volta === voltar ? `${volta}${volta.includes('?') ? '&' : '?'}cliente=${gravado}` : volta)
}

const FORMATO_SEI = /^\d{4}\.\d{4}\/\d{7}-\d$/
const numeroSei = () => campo.opcional().refine((v) => !v || FORMATO_SEI.test(v), 'Use o formato 6027.2026/0000021-3')

const esquemaProcesso = z.object({
  id: campo.opcional(),
  clienteId: campo.texto('Escolha o cliente'),
  empreendimento: campo.texto(),
  endereco: z.string().trim(),
  responsavel: z.string().trim(),
  servico: z.enum(['licenciamento', 'manejo']),
  numeroSei: numeroSei(),
  numeroSimproc: campo.opcional().refine((v) => !v || /^\d{4}-0\.\d{3}\.\d{3}-\d$/.test(v), 'Use o formato 2016-0.084.512-3'),
  numeroTca: campo.opcional(),
  faseAtual: z.coerce
    .number()
    .int()
    .min(1)
    .max(FASES.length)
    .transform((n) => n as NumeroFase),
  voltar: campo.opcional(),
  /** Ato do Diário Oficial de onde o cadastro partiu: o processo novo já sai com ele lançado. */
  ato: campo.opcional(),
})

export async function salvarProcesso(_: EstadoFormulario, formData: FormData): Promise<EstadoFormulario> {
  await exigirArea('prazos', 'editar')
  const lido = lerFormulario(esquemaProcesso, formData)
  if ('estado' in lido) return lido.estado
  const { id, voltar, ato, ...dados } = lido.dados
  if (await seiEmUso(dados.numeroSei, id)) {
    return { erro: 'Confira os campos destacados.', erros: { numeroSei: 'Já existe um projeto com este nº SEI' }, valores: valoresDoFormulario(formData) }
  }
  const gravado = await gravarProcesso(dados, id)
  if (ato && !id) await lancarNoProcessoNovo(ato, { ...dados, id: gravado, eventos: [] })
  atualizarTelas()
  if (ato && !id) {
    redirect(`/publicacoes?lancado=${encodeURIComponent(ato)}`)
  }
  redirect(destino(voltar, `/projetos/${gravado}`))
}

const esquemaEvento = z.object({
  processoId: campo.texto(),
  tipo: z.enum(TIPOS_EVENTO, { error: 'Escolha a etapa' }),
  data: campo.data(),
  diasNoAto: campo
    .opcional()
    .refine((v) => !v || /^\d+$/.test(v), 'Use um número de dias')
    .transform((v) => (v ? Number(v) : undefined)),
  observacao: campo.opcional(),
  numeroSei: numeroSei(),
})

/** Marca uma etapa do processo (lança o evento à mão). */
export async function lancarEvento(_: EstadoFormulario, formData: FormData): Promise<EstadoFormulario> {
  await exigirArea('prazos', 'editar')
  const lido = lerFormulario(esquemaEvento, formData)
  if ('estado' in lido) return lido.estado
  const { processoId, numeroSei, ...evento } = lido.dados
  const info = EVENTOS[evento.tipo]
  const recusar = (nome: string, mensagem: string) => ({ erro: 'Confira os campos destacados.', erros: { [nome]: mensagem }, valores: valoresDoFormulario(formData) })

  const [dados, dia] = await Promise.all([obterProcesso(processoId), hoje()])
  if (!dados) return { erro: 'Projeto não encontrado.' }
  if (evento.data > dia && !info.planejada) return recusar('data', 'Marque a etapa depois que ela acontecer, com a data em que aconteceu.')
  const seiNovo = evento.tipo === 'autuacao' && !dados.processo.numeroSei ? numeroSei : undefined
  if (await seiEmUso(seiNovo, processoId)) return recusar('numeroSei', 'Já existe um projeto com este nº SEI')

  await gravarEvento(
    dados.processo,
    { ...evento, diasNoAto: info.prazoNoAto ? evento.diasNoAto : undefined, observacao: evento.observacao, origem: 'manual' },
    seiNovo,
  )
  atualizarTelas()
  return { ok: `${info.nome}: marcado.` }
}

export async function apagarEvento(id: string) {
  await exigirArea('prazos', 'editar')
  await removerEvento(id)
  atualizarTelas()
}

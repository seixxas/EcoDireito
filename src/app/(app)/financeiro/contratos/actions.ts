'use server'

import { refresh } from 'next/cache'
import { z } from 'zod'
import { adicionarParcela, alterarParcela, apagarParcela, listarContratos } from '@/data/financeiro'
import { exigirArea } from '@/data/sessao'
import { EVENTOS, type TipoEvento } from '@/domain/processos'
import { campo, lerFormulario, type EstadoFormulario } from '@/lib/formulario'

const esquema = z.object({
  processoId: campo.texto(),
  /** Vazio = parcela nova. */
  id: campo.opcional(),
  descricao: campo.texto('Descreva a parcela'),
  valor: campo.dinheiro().refine((valor) => valor > 0, 'Informe um valor maior que zero'),
  gatilho: z.enum(Object.keys(EVENTOS) as [TipoEvento, ...TipoEvento[]], 'Escolha o evento'),
})

export async function salvarParcela(_: EstadoFormulario, formData: FormData): Promise<EstadoFormulario> {
  await exigirArea('financeiro', 'editar')
  const lido = lerFormulario(esquema, formData)
  if ('estado' in lido) return lido.estado

  const { processoId, id, ...dados } = lido.dados
  if (id) await alterarParcela(id, dados)
  else await adicionarParcela(processoId, dados)
  refresh()
  return { ok: id ? 'Parcela salva.' : 'Parcela incluída.' }
}

/** Parcela já faturada não sai: a nota perderia o vínculo com o contrato. */
export async function excluirParcela(formData: FormData) {
  await exigirArea('financeiro', 'editar')
  const id = String(formData.get('id'))
  const item = (await listarContratos()).flatMap((c) => c.parcelas).find((p) => p.parcela.id === id)
  if (item && !item.nota) await apagarParcela(id)
  refresh()
}

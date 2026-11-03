import { describe, expect, it } from 'vitest'
import { z } from 'zod'
import { campo, lerFormulario } from './formulario'

const formulario = (campos: Record<string, string>) => {
  const dados = new FormData()
  for (const [nome, valor] of Object.entries(campos)) dados.set(nome, valor)
  return dados
}

describe('lerFormulario', () => {
  const esquema = z.object({ nome: campo.texto(), clienteId: campo.opcional(), valor: campo.dinheiro() })

  it('aceita campo opcional ausente ou vazio', () => {
    expect(lerFormulario(esquema, formulario({ nome: 'Ana', valor: '10' }))).toEqual({ dados: { nome: 'Ana', clienteId: undefined, valor: 1_000 } })
    expect(lerFormulario(esquema, formulario({ nome: 'Ana', clienteId: '  ', valor: '10' }))).toEqual({ dados: { nome: 'Ana', clienteId: undefined, valor: 1_000 } })
  })

  it('devolve erros por campo e repõe o que foi digitado', () => {
    const lido = lerFormulario(esquema, formulario({ nome: '', valor: 'abc' }))
    expect(lido).toMatchObject({ estado: { erros: { nome: expect.any(String), valor: 'Valor inválido' }, valores: { nome: '', valor: 'abc' } } })
  })
})

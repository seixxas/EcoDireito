import { describe, expect, it } from 'vitest'
import { caminhoInterno, inicioDoPapel, pode } from './permissoes'

describe('permissões', () => {
  it('cada perfil vê e edita só a sua parte', () => {
    expect(pode('socia', 'financeiro', 'editar')).toBe(true)
    expect(pode('financeiro', 'prazos')).toBe(true)
    expect(pode('financeiro', 'prazos', 'editar')).toBe(false)
    expect(pode('equipe', 'financeiro')).toBe(false)
    expect(pode('contador', 'financeiro', 'editar')).toBe(false)
    expect(pode('cliente', 'prazos')).toBe(false)
    expect(inicioDoPapel('cliente')).toBe('/portal')
  })

  it('volta depois do login só para caminho do próprio site', () => {
    expect(caminhoInterno('/financeiro/dre')).toBe(true)
    expect(caminhoInterno('//outro.com/login')).toBe(false)
    expect(caminhoInterno('/\\outro.com')).toBe(false)
    expect(caminhoInterno('https://outro.com')).toBe(false)
  })
})

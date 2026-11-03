export const PAPEIS = {
  socia: { nome: 'Sócia', comercial: 'editar', prazos: 'editar', financeiro: 'editar', usuarios: 'editar' },
  financeiro: { nome: 'Financeiro', comercial: 'ver', prazos: 'ver', financeiro: 'editar', usuarios: 'nada' },
  equipe: { nome: 'Equipe técnica', comercial: 'ver', prazos: 'editar', financeiro: 'nada', usuarios: 'nada' },
  contador: { nome: 'Contador', comercial: 'nada', prazos: 'nada', financeiro: 'ver', usuarios: 'nada' },
  cliente: { nome: 'Cliente', comercial: 'nada', prazos: 'nada', financeiro: 'nada', usuarios: 'nada' },
} as const

export type Papel = keyof typeof PAPEIS
export type Area = 'comercial' | 'prazos' | 'financeiro' | 'usuarios'
export type Acesso = 'ver' | 'editar'

export function ehPapel(valor: unknown): valor is Papel {
  return typeof valor === 'string' && valor in PAPEIS
}

export function pode(papel: Papel, area: Area, acesso: Acesso = 'ver') {
  const nivel = PAPEIS[papel][area]
  return acesso === 'ver' ? nivel !== 'nada' : nivel === 'editar'
}

/** Só caminhos do próprio site: "/x", nunca "//outro.com" ou "/\outro.com" (o navegador trataria como outro site). */
export function caminhoInterno(caminho: string) {
  return /^\/(?![/\\])/.test(caminho)
}

/** Primeira tela depois do login. */
export function inicioDoPapel(papel: Papel) {
  if (papel === 'cliente') return '/portal'
  if (papel === 'contador') return '/financeiro'
  return '/'
}

export const PAPEIS = {
  socia: { nome: 'Sócia', prazos: 'editar', financeiro: 'editar' },
  financeiro: { nome: 'Financeiro', prazos: 'ver', financeiro: 'editar' },
  equipe: { nome: 'Equipe técnica', prazos: 'editar', financeiro: 'nada' },
  contador: { nome: 'Contador', prazos: 'nada', financeiro: 'ver' },
  cliente: { nome: 'Cliente', prazos: 'nada', financeiro: 'nada' },
} as const

export type Papel = keyof typeof PAPEIS
export type Area = 'prazos' | 'financeiro'
export type Acesso = 'ver' | 'editar'

export function ehPapel(valor: unknown): valor is Papel {
  return typeof valor === 'string' && valor in PAPEIS
}

export function pode(papel: Papel, area: Area, acesso: Acesso = 'ver') {
  const nivel = PAPEIS[papel][area]
  return acesso === 'ver' ? nivel !== 'nada' : nivel === 'editar'
}

/** Primeira tela depois do login. */
export function inicioDoPapel(papel: Papel) {
  if (papel === 'cliente') return '/portal'
  if (papel === 'contador') return '/financeiro'
  return '/'
}

import type { NomeIcone } from '@/components/ui/icone'
import type { Area } from '@/lib/permissoes'

/** O que dá para cadastrar de qualquer tela: no grupo Cadastros do menu lateral e, no celular, no botão Novo do topo. */
export const CADASTROS: { href: string; rotulo: string; icone: NomeIcone; area: Area }[] = [
  { href: '/projetos/clientes/novo', rotulo: 'Cliente', icone: 'person_add', area: 'prazos' },
  { href: '/projetos/novo', rotulo: 'Projeto', icone: 'create_new_folder', area: 'prazos' },
  { href: '/comercial/nova', rotulo: 'Proposta', icone: 'post_add', area: 'comercial' },
  { href: '/financeiro/notas/nova', rotulo: 'Nota fiscal', icone: 'receipt_long', area: 'financeiro' },
  { href: '/financeiro/lancamentos?novo=1', rotulo: 'Lançamento', icone: 'note_add', area: 'financeiro' },
]

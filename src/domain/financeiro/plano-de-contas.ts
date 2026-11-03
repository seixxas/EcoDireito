/** Plano de contas da Eco Direito, na ordem da DRE que elas já usam. */
export const CONTAS = [
  { id: 'receita_servicos', nome: 'Receita bruta de serviços', grupo: 'receita' },
  { id: 'simples', nome: 'Simples Nacional', grupo: 'imposto' },
  { id: 'art', nome: 'ART', grupo: 'custo' },
  { id: 'servicos_terceiros', nome: 'Serviços de terceiros', grupo: 'custo' },
  { id: 'equipamentos', nome: 'Equipamentos', grupo: 'custo' },
  { id: 'gerais', nome: 'Gerais', grupo: 'despesa' },
  { id: 'aluguel', nome: 'Aluguel', grupo: 'despesa' },
  { id: 'energia', nome: 'Energia', grupo: 'despesa' },
  { id: 'agua', nome: 'Água', grupo: 'despesa' },
  { id: 'escritorio', nome: 'Escritório', grupo: 'despesa' },
  { id: 'telecom', nome: 'Telecom', grupo: 'despesa' },
  { id: 'ti', nome: 'TI', grupo: 'despesa' },
  { id: 'copa', nome: 'Copa e café', grupo: 'despesa' },
  { id: 'contabilidade', nome: 'Contabilidade', grupo: 'despesa' },
  { id: 'seguros', nome: 'Seguros', grupo: 'despesa' },
  { id: 'manutencao_veiculos', nome: 'Manutenção de veículos', grupo: 'despesa' },
  { id: 'estacionamento', nome: 'Estacionamento', grupo: 'despesa' },
  { id: 'alimentacao', nome: 'Alimentação', grupo: 'despesa' },
  { id: 'transporte', nome: 'Transporte e combustível', grupo: 'despesa' },
  { id: 'juridico', nome: 'Jurídico', grupo: 'despesa' },
  { id: 'eventos', nome: 'Eventos', grupo: 'despesa' },
  { id: 'representacao', nome: 'Representação', grupo: 'despesa' },
  { id: 'tributos', nome: 'Tributos (ISS e taxas)', grupo: 'despesa' },
  { id: 'doacoes', nome: 'Doações', grupo: 'despesa' },
  { id: 'cartao', nome: 'Cartão de crédito', grupo: 'despesa' },
  { id: 'receitas_financeiras', nome: 'Receitas financeiras', grupo: 'financeiro' },
  { id: 'despesas_financeiras', nome: 'Despesas financeiras', grupo: 'financeiro' },
  { id: 'reembolsos', nome: 'Reembolsos', grupo: 'outras' },
  { id: 'estornos', nome: 'Estornos', grupo: 'outras' },
  { id: 'distribuicao_lucros', nome: 'Distribuição de lucros', grupo: 'fora' },
  { id: 'mutuo', nome: 'Mútuo entre empresas', grupo: 'fora' },
  { id: 'aplicacoes', nome: 'Investimentos e aplicações', grupo: 'fora' },
  { id: 'imobilizado', nome: 'Imobilizado', grupo: 'fora' },
] as const

export type Conta = (typeof CONTAS)[number]
export type ContaId = Conta['id']
export type GrupoDre = Conta['grupo']

export function nomeDaConta(id: ContaId) {
  return CONTAS.find((conta) => conta.id === id)!.nome
}

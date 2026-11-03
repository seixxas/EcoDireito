import type { Cliente } from '@/domain/processos'

/** CNPJ inventado, com dígitos verificadores válidos. */
function cnpj(raiz: string) {
  const digitos = `${raiz}0001`.split('').map(Number)
  const verificador = (numeros: number[]) => {
    const pesos = numeros.length === 12 ? [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2] : [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
    const resto = numeros.reduce((soma, n, i) => soma + n * pesos[i], 0) % 11
    return resto < 2 ? 0 : 11 - resto
  }
  const d1 = verificador(digitos)
  const s = [...digitos, d1, verificador([...digitos, d1])].join('')
  return `${s.slice(0, 2)}.${s.slice(2, 5)}.${s.slice(5, 8)}/${s.slice(8, 12)}-${s.slice(12)}`
}

type ClienteDemo = Cliente & {
  /** Retém 5,5% de imposto na fonte. */
  retem: boolean
  /** Frequência relativa de notas. */
  peso: number
}

const spe = (id: string, nome: string, raiz: string, grupo: string, retem: boolean): ClienteDemo => ({
  id,
  nome,
  documento: cnpj(raiz),
  grupo,
  retem,
  peso: 3,
})

export const CLIENTES: ClienteDemo[] = [
  spe('altavista-pinheiros', 'Altavista Pinheiros Empreendimento Imobiliário SPE Ltda', '41582736', 'Altavista', true),
  spe('altavista-vila-mariana', 'Altavista Vila Mariana Empreendimento Imobiliário SPE Ltda', '41582819', 'Altavista', true),
  spe('altavista-butanta', 'Altavista Butantã Empreendimento Imobiliário SPE Ltda', '41583027', 'Altavista', true),
  spe('horizonte-moema', 'Horizonte Moema Incorporação SPE Ltda', '38204517', 'Horizonte Paulista', false),
  spe('horizonte-perdizes', 'Horizonte Perdizes Incorporação SPE Ltda', '38204630', 'Horizonte Paulista', false),
  spe('horizonte-tatuape', 'Horizonte Tatuapé Incorporação SPE Ltda', '38204742', 'Horizonte Paulista', false),
  spe('vertice-brooklin', 'Vértice Brooklin Empreendimentos SPE Ltda', '45917308', 'Vértice', true),
  spe('vertice-santana', 'Vértice Santana Empreendimentos SPE Ltda', '45917421', 'Vértice', true),
  spe('vertice-aclimacao', 'Vértice Aclimação Empreendimentos SPE Ltda', '45917533', 'Vértice', true),
  spe('serra-azul-lapa', 'Serra Azul Lapa Construções SPE Ltda', '29741056', 'Serra Azul', false),
  spe('serra-azul-ipiranga', 'Serra Azul Ipiranga Construções SPE Ltda', '29741168', 'Serra Azul', false),
  spe('jequitiba-morumbi', 'Jequitibá Morumbi Desenvolvimento Imobiliário SPE Ltda', '50362914', 'Jequitibá', false),
  spe('jequitiba-campo-belo', 'Jequitibá Campo Belo Desenvolvimento Imobiliário SPE Ltda', '50363027', 'Jequitibá', false),
  spe('lumen-vila-olimpia', 'Lumen Vila Olímpia SPE Ltda', '47120385', 'Lumen', true),
  spe('lumen-pompeia', 'Lumen Pompeia SPE Ltda', '47120497', 'Lumen', true),
  { id: 'bom-preco', nome: 'Supermercados Bom Preço Ltda', documento: cnpj('12873045'), retem: true, peso: 2 },
  { id: 'bebidas-serrana', nome: 'Indústria de Bebidas Serrana S.A.', documento: cnpj('09341782'), retem: true, peso: 1 },
  { id: 'hospital-santa-clara', nome: 'Hospital Santa Clara S.A.', documento: cnpj('22618459'), retem: true, peso: 1 },
  { id: 'consorcio-linha-verde', nome: 'Consórcio Linha Verde Mobilidade', documento: cnpj('51207634'), retem: true, peso: 1 },
  { id: 'laticinios-vale-verde', nome: 'Laticínios Vale Verde Ltda', documento: cnpj('17592840'), retem: false, peso: 1 },
  { id: 'metalurgica-paulistana', nome: 'Metalúrgica Paulistana Ltda', documento: cnpj('33840127'), retem: false, peso: 1 },
  { id: 'colegio-monteiro', nome: 'Colégio Monteiro Lobato Ltda', documento: cnpj('26473918'), retem: false, peso: 1 },
  { id: 'condominio-bosque-real', nome: 'Condomínio Residencial Bosque Real', documento: cnpj('44019276'), retem: false, peso: 1 },
  { id: 'condominio-jardim-europa', nome: 'Condomínio Edifício Jardim Europa', documento: cnpj('44127583'), retem: false, peso: 1 },
  { id: 'mariana-toledo', nome: 'Mariana Toledo Alves', documento: '318.472.905-60', retem: false, peso: 1 },
  { id: 'ricardo-prado', nome: 'Ricardo Nogueira Prado', documento: '204.618.337-15', retem: false, peso: 1 },
]

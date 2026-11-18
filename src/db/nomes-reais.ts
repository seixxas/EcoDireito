/**
 * Troca os nomes fictícios dos clientes pelos reais na hora de gravar a base de demonstração (pedido de 18/11:
 * na reunião, as sócias veem as empresas que conhecem; valores, CNPJs e lançamentos continuam inventados).
 * O mapa fica em dados-reais/nomes-dos-clientes.json, fora do Git ({ "nome fictício": "nome real" }).
 * Sem o arquivo, nada muda e a base sai toda fictícia.
 */
import { existsSync, readFileSync } from 'node:fs'

const ARQUIVO = 'dados-reais/nomes-dos-clientes.json'

// Do nome mais longo ao mais curto: a razão social inteira antes do apelido ("Lumen Pompeia SPE Ltda" antes de "Lumen").
// O Diário escreve o interessado em maiúsculas: cada par vale também em caixa alta.
const PARES: [string, string][] = existsSync(ARQUIVO)
  ? Object.entries(JSON.parse(readFileSync(ARQUIVO, 'utf8')) as Record<string, string>)
      .flatMap(([de, para]): [string, string][] => [
        [de, para],
        [de.toUpperCase(), para.toUpperCase()],
      ])
      .sort(([a], [b]) => b.length - a.length)
  : []

export const usaNomesReais = PARES.length > 0

function trocarNoTexto(texto: string) {
  return PARES.reduce((t, [de, para]) => t.split(de).join(para), texto)
}

/** Percorre a base e troca os nomes em todo texto (cliente, empreendimento, Diário, lançamentos). Datas e números ficam. */
export function trocarNomes<T>(valor: T): T {
  if (!usaNomesReais) return valor
  if (typeof valor === 'string') return trocarNoTexto(valor) as T
  if (Array.isArray(valor)) return valor.map(trocarNomes) as T
  if (valor && Object.getPrototypeOf(valor) === Object.prototype) {
    return Object.fromEntries(Object.entries(valor).map(([chave, v]) => [chave, trocarNomes(v)])) as T
  }
  return valor
}

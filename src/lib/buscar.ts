/** Sem acento, em minúsculas, quebrado em palavras: pontuação ("6027.2026/0003127-4", "1.250,00") também separa. */
const palavrasDe = (texto: string) =>
  texto
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter(Boolean)

/**
 * A busca combina quando cada palavra dela é o começo de uma palavra de algum dos textos, sem ligar para acento e maiúscula:
 * "lumen" acha "Lumen Pompeia" mas não "emolumentos". Busca vazia combina com tudo.
 */
export function combina(busca: string | undefined, ...textos: (string | number | undefined | null)[]) {
  const procuradas = palavrasDe(busca ?? '')
  if (!procuradas.length) return true
  const alvo = palavrasDe(textos.filter((t) => t !== undefined && t !== null).join(' '))
  return procuradas.every((procurada) => alvo.some((palavra) => palavra.startsWith(procurada)))
}

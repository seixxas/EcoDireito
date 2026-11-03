const normalizar = (texto: string) =>
  texto
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()

/** A busca combina quando todas as palavras dela aparecem em algum dos textos, sem ligar para acento e maiúscula. Busca vazia combina com tudo. */
export function combina(busca: string | undefined, ...textos: (string | number | undefined | null)[]) {
  const palavras = normalizar(busca ?? '').split(/\s+/).filter(Boolean)
  if (!palavras.length) return true
  const alvo = normalizar(textos.filter((t) => t !== undefined && t !== null).join(' '))
  return palavras.every((palavra) => alvo.includes(palavra))
}

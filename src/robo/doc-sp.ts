import { z } from 'zod'
import { ORGAO_SVMA, type Ato } from '@/domain/publicacoes'
import type { DataISO } from '@/lib/datas'

export type AtoColetado = Ato & { link: string }

export type Edicao = { data: DataISO; totalAtos: number; atos: AtoColetado[] }

/** "Diário Aberto": a edição inteira do dia, gratuita e sem captcha. */
export function urlDaEdicao(data: DataISO) {
  const [ano, mes, dia] = data.split('-')
  return `https://diariooficial.prefeitura.sp.gov.br/md_epubli_controlador.php?acao=edicao_download&dta=${dia}%2F${mes}%2F${ano}&formato=json`
}

/** Se o formato mudar, a leitura falha alto em vez de devolver uma edição vazia. */
const esquemaEdicao = z.object({
  edicao: z.array(
    z.object({
      orgao: z.string(),
      unidade: z.string(),
      serie: z.string(),
      processo: z.string(),
      documento: z.string(),
      link: z.string(),
      conteudo: z.string(),
    }),
  ),
})

const espacos = (texto: string) => texto.replace(/\s+/g, ' ').trim()

/** O JSON da edição vem com ";" no fim. Devolve o total de atos e só os da Secretaria do Verde, com o texto sem HTML. */
export function lerEdicao(json: string, data: DataISO): Edicao {
  const { edicao } = esquemaEdicao.parse(JSON.parse(json.trim().replace(/;$/, '')))
  return {
    data,
    totalAtos: edicao.length,
    atos: edicao
      .filter((linha) => linha.orgao === ORGAO_SVMA)
      .map((linha) => ({
        id: `doc-${data}-${linha.documento}`,
        data,
        orgao: linha.orgao,
        unidade: espacos(linha.unidade),
        serie: espacos(linha.serie),
        processo: linha.processo.trim(),
        documento: linha.documento.trim(),
        texto: htmlParaTexto(linha.conteudo),
        link: linha.link,
      })),
  }
}

/** Sem edição (fim de semana, feriado, ponto facultativo) o DOC-SP responde 500. Qualquer outra resposta ruim é falha. */
export async function baixarEdicao(data: DataISO, buscar: typeof fetch = fetch): Promise<Edicao | undefined> {
  const resposta = await buscar(urlDaEdicao(data), { signal: AbortSignal.timeout(120_000) })
  if (resposta.status === 500) return undefined
  if (!resposta.ok) throw new Error(`O Diário Oficial respondeu ${resposta.status} ao baixar a edição de ${data}.`)
  return lerEdicao(await resposta.text(), data)
}

const ACENTOS: Record<string, string> = { acute: '́', grave: '̀', circ: '̂', tilde: '̃', uml: '̈', cedil: '̧', ring: '̊' }

const ENTIDADES: Record<string, string> = {
  nbsp: ' ', amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", ordm: 'º', ordf: 'ª', deg: '°', sect: '§', para: '¶',
  ldquo: '“', rdquo: '”', lsquo: '‘', rsquo: '’', laquo: '«', raquo: '»', ndash: '–', mdash: '—', hellip: '…',
  middot: '·', bull: '•', times: '×', sup1: '¹', sup2: '²', sup3: '³', frac12: '½', euro: '€', reg: '®', copy: '©',
}

/** `&atilde;` vira "a" + til combinado; numéricas e as do mapa acima, direto. A desconhecida fica como está. */
function decodificar(entidade: string, nome: string) {
  if (nome.startsWith('#x') || nome.startsWith('#X')) return String.fromCodePoint(parseInt(nome.slice(2), 16))
  if (nome.startsWith('#')) return String.fromCodePoint(Number(nome.slice(1)))
  if (nome in ENTIDADES) return ENTIDADES[nome]
  const letra = /^([a-zA-Z])(acute|grave|circ|tilde|uml|cedil|ring)$/.exec(nome)
  return letra ? (letra[1] + ACENTOS[letra[2]]).normalize('NFC') : entidade
}

/** Texto corrido do ato: um parágrafo por linha, células de tabela separadas por espaço. */
export function htmlParaTexto(html: string) {
  return html
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<\/?(p|div|br|tr|li|h\d|table|thead|tbody|ul|ol)\b[^>]*>/gi, '\n')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&(#\d+|#[xX][0-9a-fA-F]+|[a-zA-Z][a-zA-Z0-9]*);/g, decodificar)
    .split('\n')
    .map(espacos)
    .filter(Boolean)
    .join('\n')
}

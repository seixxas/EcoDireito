import type { DataISO } from '@/lib/datas'
import { centavosDoTexto, reais, type Centavos } from '@/lib/dinheiro'

/** Uma linha do extrato do banco, como veio do arquivo. */
export type LinhaExtrato = {
  /** Identifica a linha entre importações, para o mesmo arquivo não entrar duas vezes. */
  chave: string
  data: DataISO
  descricao: string
  /** Positivo = crédito, negativo = débito. */
  valor: Centavos
}

export type Leitura = { linhas: LinhaExtrato[] } | { erro: string }

type Bruta = Omit<LinhaExtrato, 'chave'> & { idDoBanco?: string }

/** Minúsculas, sem acento e sem espaço repetido. */
export function normalizar(texto: string) {
  return texto
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim()
}

/** Bancos brasileiros ainda exportam em Windows-1252; o resto é UTF-8. */
export function decodificar(bytes: Uint8Array) {
  try {
    return new TextDecoder('utf-8', { fatal: true }).decode(bytes)
  } catch {
    return new TextDecoder('windows-1252').decode(bytes)
  }
}

export function lerExtrato(texto: string): Leitura {
  const ofx = /<OFX>/i.test(texto)
  const lido = ofx ? { linhas: lerOfx(texto) } : lerCsv(texto)
  if ('erro' in lido) return lido
  const validas = lido.linhas.filter((l) => /^\d{4}-\d{2}-\d{2}$/.test(l.data) && Number.isFinite(l.valor) && l.valor !== 0)
  if (!validas.length) return { erro: 'Não achei lançamentos neste arquivo.' }
  // O OFX traz o número da conta: a mesma tarifa no mesmo dia em duas contas são duas linhas. O CSV não traz.
  return { linhas: comChaves(validas, ofx ? tag(texto, 'ACCTID') : undefined) }
}

/** O id do banco (FITID) nem sempre é único; data, valor e a ordem no arquivo desempatam. */
function comChaves(linhas: Bruta[], conta?: string): LinhaExtrato[] {
  const vistas = new Map<string, number>()
  return linhas.map(({ idDoBanco, ...linha }) => {
    const base = [conta, idDoBanco ?? normalizar(linha.descricao), linha.data, linha.valor].filter((parte) => parte !== undefined).join('|')
    const vezes = (vistas.get(base) ?? 0) + 1
    vistas.set(base, vezes)
    return { ...linha, chave: vezes > 1 ? `${base}#${vezes}` : base }
  })
}

function tag(bloco: string, nome: string) {
  return bloco.match(new RegExp(`<${nome}>([^<\\r\\n]*)`, 'i'))?.[1].trim() || undefined
}

/** OFX 1.x (SGML, tags sem fechar) e 2.x (XML). */
function lerOfx(texto: string): Bruta[] {
  return texto
    .split(/<STMTTRN>/i)
    .slice(1)
    .map((bloco) => {
      const data = tag(bloco, 'DTPOSTED') ?? ''
      return {
        data: `${data.slice(0, 4)}-${data.slice(4, 6)}-${data.slice(6, 8)}`,
        valor: reais(Number((tag(bloco, 'TRNAMT') ?? '').replace(',', '.'))),
        descricao: [...new Set([tag(bloco, 'NAME'), tag(bloco, 'MEMO')].filter(Boolean))].join(' · '),
        idDoBanco: tag(bloco, 'FITID'),
      }
    })
}

function celulas(linha: string, separador: string) {
  const resultado: string[] = []
  let atual = ''
  let entreAspas = false
  for (let i = 0; i < linha.length; i++) {
    const c = linha[i]
    if (c === '"' && entreAspas && linha[i + 1] === '"') {
      atual += '"'
      i++
    } else if (c === '"') entreAspas = !entreAspas
    else if (c === separador && !entreAspas) {
      resultado.push(atual.trim())
      atual = ''
    } else atual += c
  }
  resultado.push(atual.trim())
  return resultado
}

function dataDoTexto(texto: string): DataISO {
  const br = texto.match(/^(\d{2})\/(\d{2})\/(\d{2}|\d{4})\b/)
  if (br) return `${br[3].length === 2 ? `20${br[3]}` : br[3]}-${br[2]}-${br[1]}`
  return texto.match(/^\d{4}-\d{2}-\d{2}/)?.[0] ?? ''
}

/** "150,00", "-150,00", "150,00 D" ou "150,00 C". */
function valorDoTexto(texto: string): Centavos {
  const debito = /\s*D$/i.test(texto)
  const valor = centavosDoTexto(texto.replace(/\s*[CD]$/i, '')) ?? NaN
  return debito ? -Math.abs(valor) : valor
}

type Colunas = { data: number; descricao: number[]; valor: number; credito: number; debito: number }

/** Sem cabeçalho (como no Itaú): data; descrição; valor. */
const SEM_CABECALHO: Colunas = { data: 0, descricao: [1], valor: 2, credito: -1, debito: -1 }

function colunasPeloNome(cabecalho: string[]): Colunas | undefined {
  const nomes = cabecalho.map(normalizar)
  const coluna = (padrao: RegExp) => nomes.findIndex((nome) => padrao.test(nome))
  const colunas = {
    data: coluna(/^data/),
    // Alguns bancos separam "Histórico" ("Pix enviado") e "Descrição" (o nome): fica com as duas.
    // Só pelo começo do nome: "Lançamento" (Bradesco) é descrição; "Valor do lançamento" e "Tipo lançamento" não.
    descricao: nomes.flatMap((nome, i) => (/^(hist|descri|lancamento|memo|detalhe)/.test(nome) ? [i] : [])),
    valor: coluna(/^valor/),
    credito: coluna(/credito|entrada/),
    debito: coluna(/debito|saida/),
  }
  const temValor = colunas.valor >= 0 || (colunas.credito >= 0 && colunas.debito >= 0)
  return colunas.descricao.length && temValor ? colunas : undefined
}

/** CSV de banco: acha o cabeçalho pela coluna "Data" e as demais colunas pelo nome. */
function lerCsv(texto: string): { linhas: Bruta[] } | { erro: string } {
  const linhas = texto.split(/\r?\n/).filter((l) => l.trim())
  const iCabecalho = linhas.findIndex((l) => /(^|[;,\t"])\s*data\b/i.test(l))
  const referencia = linhas[Math.max(iCabecalho, 0)] ?? ''
  const separador = [';', '\t', ','].sort((a, b) => referencia.split(b).length - referencia.split(a).length)[0]
  const semCabecalho = iCabecalho < 0 && dataDoTexto(celulas(referencia, separador)[0]) !== ''
  const col = semCabecalho ? SEM_CABECALHO : iCabecalho >= 0 ? colunasPeloNome(celulas(referencia, separador)) : undefined
  if (!col) return { erro: 'Arquivo não reconhecido. Use o OFX do banco ou um CSV com as colunas Data, Descrição e Valor.' }

  return {
    linhas: linhas
      .slice(iCabecalho + 1)
      .map((linha) => celulas(linha, separador))
      .map((c) => ({
        data: dataDoTexto(c[col.data] ?? ''),
        descricao: col.descricao
          .map((i) => c[i])
          .filter(Boolean)
          .join(' · '),
        valor:
          col.valor >= 0
            ? valorDoTexto(c[col.valor] ?? '')
            : Math.abs(centavosDoTexto(c[col.credito] ?? '') ?? 0) - Math.abs(centavosDoTexto(c[col.debito] ?? '') ?? 0),
      }))
      // "Saldo anterior" e "saldo do dia" não são movimento.
      .filter((linha) => !normalizar(linha.descricao).startsWith('saldo')),
  }
}

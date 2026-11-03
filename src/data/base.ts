import type { DataISO } from '@/lib/datas'
import { hoje } from './hoje'
import { gerarBase, type Base } from './seed'

let cache: { dia: DataISO; base: Base } | undefined

/** Base fictícia do dia, gerada uma vez e reaproveitada. Quando o banco entrar, este arquivo some. */
export async function carregar() {
  const dia = await hoje()
  if (cache?.dia !== dia) cache = { dia, base: gerarBase(dia) }
  return { hoje: dia, ...cache.base }
}

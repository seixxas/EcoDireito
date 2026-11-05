import { hojeEmSaoPaulo, type DataISO } from '@/lib/datas'
import { guardarNaTela } from './telas'

/** Única fonte da data de hoje no servidor. `DATA_DEMO=AAAA-MM-DD` congela a data numa apresentação. */
export async function hoje(): Promise<DataISO> {
  'use cache: private'
  guardarNaTela()
  return process.env.DATA_DEMO ?? hojeEmSaoPaulo()
}

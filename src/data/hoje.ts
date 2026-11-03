import { connection } from 'next/server'
import { hojeEmSaoPaulo, type DataISO } from '@/lib/datas'

/** Única fonte da data de hoje no servidor. `DATA_DEMO=AAAA-MM-DD` congela a data numa apresentação. */
export async function hoje(): Promise<DataISO> {
  await connection()
  return process.env.DATA_DEMO ?? hojeEmSaoPaulo()
}

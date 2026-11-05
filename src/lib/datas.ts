/** Data sem horário, no formato 'AAAA-MM-DD'. */
export type DataISO = string

const DIA_MS = 86_400_000

function paraMs(data: DataISO) {
  return Date.UTC(Number(data.slice(0, 4)), Number(data.slice(5, 7)) - 1, Number(data.slice(8, 10)))
}

function deMs(ms: number): DataISO {
  return new Date(ms).toISOString().slice(0, 10)
}

/** Só `src/data/hoje.ts` deve chamar: ali a data atual fica num escopo de cache, como o Next exige. */
export function hojeEmSaoPaulo(): DataISO {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo' }).format(new Date())
}

export function somarDias(data: DataISO, dias: number): DataISO {
  return deMs(paraMs(data) + dias * DIA_MS)
}

/** Mantém o dia; se o mês de destino for mais curto, usa o último dia dele. */
export function somarMeses(data: DataISO, meses: number): DataISO {
  const ano = Number(data.slice(0, 4))
  const mes = Number(data.slice(5, 7)) - 1 + meses
  const dia = Number(data.slice(8, 10))
  const ultimoDia = new Date(Date.UTC(ano, mes + 1, 0)).getUTCDate()
  return deMs(Date.UTC(ano, mes, Math.min(dia, ultimoDia)))
}

export function diasEntre(de: DataISO, ate: DataISO): number {
  return Math.round((paraMs(ate) - paraMs(de)) / DIA_MS)
}

/** 0 = domingo, 6 = sábado. */
export function diaDaSemana(data: DataISO): number {
  return new Date(paraMs(data)).getUTCDay()
}

/** 'AAAA-MM' */
export function mesDe(data: DataISO): string {
  return data.slice(0, 7)
}

/** Meses 'AAAA-MM' de `de` até `ate`, inclusive. */
export function mesesEntre(de: string, ate: string): string[] {
  const meses: string[] = []
  for (let mes = `${de}-01`; mesDe(mes) <= ate; mes = somarMeses(mes, 1)) meses.push(mesDe(mes))
  return meses
}

/** Segunda-feira da semana da data. */
export function inicioDaSemana(data: DataISO): DataISO {
  return somarDias(data, -((diaDaSemana(data) + 6) % 7))
}

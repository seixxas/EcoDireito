import { diaDaSemana, somarDias, type DataISO } from '@/lib/datas'

/**
 * Dias sem expediente na Prefeitura de SP: feriados nacionais, estaduais, municipais e o Carnaval.
 * Revisar todo ano. Quando o banco entrar, vira cadastro.
 */
export const FERIADOS: Record<DataISO, string> = {
  '2026-01-01': 'Confraternização Universal',
  '2026-01-25': 'Aniversário de São Paulo',
  '2026-02-16': 'Carnaval',
  '2026-02-17': 'Carnaval',
  '2026-04-03': 'Sexta-feira Santa',
  '2026-04-21': 'Tiradentes',
  '2026-05-01': 'Dia do Trabalho',
  '2026-06-04': 'Corpus Christi',
  '2026-07-09': 'Revolução Constitucionalista',
  '2026-09-07': 'Independência',
  '2026-10-12': 'Nossa Senhora Aparecida',
  '2026-11-02': 'Finados',
  '2026-11-15': 'Proclamação da República',
  '2026-11-20': 'Consciência Negra',
  '2026-12-25': 'Natal',
  '2027-01-01': 'Confraternização Universal',
  '2027-01-25': 'Aniversário de São Paulo',
  '2027-02-08': 'Carnaval',
  '2027-02-09': 'Carnaval',
  '2027-03-26': 'Sexta-feira Santa',
  '2027-04-21': 'Tiradentes',
  '2027-05-01': 'Dia do Trabalho',
  '2027-05-27': 'Corpus Christi',
  '2027-07-09': 'Revolução Constitucionalista',
  '2027-09-07': 'Independência',
  '2027-10-12': 'Nossa Senhora Aparecida',
  '2027-11-02': 'Finados',
  '2027-11-15': 'Proclamação da República',
  '2027-11-20': 'Consciência Negra',
  '2027-12-25': 'Natal',
}

export function ehDiaUtil(data: DataISO) {
  const dia = diaDaSemana(data)
  return dia !== 0 && dia !== 6 && !(data in FERIADOS)
}

/** "domingo", "sábado" ou o nome do feriado. */
export function motivoSemExpediente(data: DataISO) {
  return FERIADOS[data] ?? (diaDaSemana(data) === 0 ? 'domingo' : 'sábado')
}

export function proximoDiaUtil(data: DataISO) {
  let dia = data
  while (!ehDiaUtil(dia)) dia = somarDias(dia, 1)
  return dia
}

export function diaUtilAnterior(data: DataISO) {
  let dia = data
  while (!ehDiaUtil(dia)) dia = somarDias(dia, -1)
  return dia
}

/** Conta `quantidade` dias úteis depois de `data` (exclui o dia de início). */
export function somarDiasUteis(data: DataISO, quantidade: number) {
  let dia = data
  for (let contados = 0; contados < quantidade; ) {
    dia = somarDias(dia, 1)
    if (ehDiaUtil(dia)) contados++
  }
  return dia
}

import type { DataISO } from '@/lib/datas'
import { CLIENTES } from './clientes'
import { gerarFinanceiro } from './financeiro'
import { gerarProcessos } from './processos'
import { gerarAtos } from './publicacoes'

/** Gera toda a base fictícia a partir da data de hoje. */
export function gerarBase(hoje: DataISO) {
  const { processos, contratos, propostas } = gerarProcessos(hoje)
  return {
    clientes: CLIENTES.map(({ id, nome, documento, grupo }) => ({ id, nome, documento, grupo })),
    processos,
    contratos,
    propostas,
    publicacoes: gerarAtos(hoje),
    financeiro: gerarFinanceiro(hoje, processos, contratos),
  }
}

export type Base = ReturnType<typeof gerarBase>

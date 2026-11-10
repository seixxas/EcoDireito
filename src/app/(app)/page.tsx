import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { hoje } from '@/data/hoje'
import { exigirUsuario } from '@/data/sessao'
import { diaDaSemana } from '@/lib/datas'
import { inicioDoPapel, pode } from '@/lib/permissoes'
import { CartaoFinanceiro } from './_resumo/cartao-financeiro'
import { CartaoProjetos } from './_resumo/cartao-projetos'
import { CartaoPropostas } from './_resumo/cartao-propostas'
import { PrazosProximos } from './_resumo/prazos-proximos'
import { PrazosVencidos } from './_resumo/prazos-vencidos'

export const metadata: Metadata = { title: 'Resumo' }

/** "10 de novembro de 2026". Meio-dia em UTC para o fuso não trocar o dia. */
const POR_EXTENSO = new Intl.DateTimeFormat('pt-BR', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' })

const DIAS_DA_SEMANA = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado']

/**
 * Resumo (desenho 3a, 10/11): o que está vencido primeiro, em vermelho; depois os prazos que vêm, e um cartão por área.
 * Cada bloco tem um número grande e um link: o detalhe fica na tela da área. Cada cartão lê os próprios dados.
 */
export default async function Resumo() {
  const usuario = await exigirUsuario()
  if (!pode(usuario.papel, 'prazos')) redirect(inicioDoPapel(usuario.papel))
  const dia = await hoje()
  const verFinanceiro = pode(usuario.papel, 'financeiro')
  const verPropostas = pode(usuario.papel, 'comercial')

  return (
    <div className="mx-auto flex w-full max-w-[1180px] flex-col gap-7 lg:px-4 lg:pt-2">
      <header>
        <h1 className="text-[1.875rem] font-semibold leading-tight tracking-[-0.02em] text-ink">Resumo</h1>
        <p className="mt-1 text-[0.9375rem] text-muted">
          {DIAS_DA_SEMANA[diaDaSemana(dia)]}, {POR_EXTENSO.format(new Date(`${dia}T12:00:00Z`))}
        </p>
      </header>

      <div className="grid gap-4 lg:grid-cols-[1fr_1.3fr]">
        <PrazosVencidos dia={dia} />
        <PrazosProximos dia={dia} />
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {verFinanceiro && <CartaoFinanceiro dia={dia} />}
        <CartaoProjetos dia={dia} />
        {verPropostas && <CartaoPropostas dia={dia} />}
      </div>
    </div>
  )
}

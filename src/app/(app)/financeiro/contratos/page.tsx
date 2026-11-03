import type { Metadata } from 'next'
import Link from 'next/link'
import { Card } from '@/components/ui/card'
import { PageHeader } from '@/components/ui/page-header'
import { ItemResumo, Resumo } from '@/components/ui/resumo'
import { listarContratos } from '@/data/financeiro'
import { exigirArea } from '@/data/sessao'
import type { SituacaoParcela } from '@/domain/financeiro/parcelas'
import { somar } from '@/lib/dinheiro'
import { brl, contar } from '@/lib/formatar'
import { pode } from '@/lib/permissoes'

export const metadata: Metadata = { title: 'Contratos' }

type Item = Awaited<ReturnType<typeof listarContratos>>[number]['parcelas'][number]

const total = (parcelas: Item[], ...situacoes: SituacaoParcela[]) =>
  somar(parcelas.filter((p) => !situacoes.length || situacoes.includes(p.situacao)).map((p) => p.parcela.valor))

export default async function PaginaContratos() {
  const [usuario, contratos] = await Promise.all([exigirArea('financeiro'), listarContratos()])
  const editar = pode(usuario.papel, 'financeiro', 'editar')
  const todas = contratos.flatMap((c) => c.parcelas)

  return (
    <>
      <PageHeader
        titulo="Contratos"
        resumo={`${brl(total(todas, 'liberada'))} pronto para faturar. A parcela fica pronta quando o evento dela é lançado no processo.`}
      />

      <Resumo className="mb-6">
        <ItemResumo rotulo="Contratado" valor={brl(total(todas))} detalhe={contar(contratos.filter((c) => c.parcelas.length).length, 'contrato', 'contratos')} />
        <ItemResumo rotulo="Faturado" valor={brl(total(todas, 'faturada', 'recebida'))} tom="ok" />
        <ItemResumo rotulo="Pronto para faturar" valor={brl(total(todas, 'liberada'))} detalhe="evento já aconteceu" tom="warn" />
        <ItemResumo rotulo="Aguardando evento" valor={brl(total(todas, 'aguardando'))} />
      </Resumo>

      <Card flush>
        <table className="tabela">
          <thead>
            <tr>
              <th>Processo</th>
              <th className="hidden sm:table-cell">Serviço</th>
              <th className="num hidden sm:table-cell">Parcelas</th>
              <th className="num">Contrato</th>
              <th className="num hidden sm:table-cell">Faturado</th>
              <th className="num hidden sm:table-cell">A faturar</th>
              {editar && <th />}
            </tr>
          </thead>
          <tbody>
            {contratos.map(({ processo, cliente, parcelas }) => (
              <tr key={processo.id}>
                <td className="sm:min-w-64">
                  <Link href={`/processos/${processo.id}`} className="font-medium text-brand-700 hover:underline">
                    {processo.empreendimento}
                  </Link>
                  <p className="hidden text-xs text-muted sm:block">{cliente.nome}</p>
                  {/* No celular a coluna "A faturar" some; o valor vem para cá. */}
                  {total(parcelas, 'liberada') > 0 && <p className="text-xs text-warn sm:hidden">{brl(total(parcelas, 'liberada'))} a faturar</p>}
                </td>
                <td className="hidden sm:table-cell">{processo.servico === 'manejo' ? 'Manejo' : 'Licenciamento'}</td>
                <td className="num hidden sm:table-cell">{parcelas.length || '—'}</td>
                <td className="num font-medium">{parcelas.length ? brl(total(parcelas)) : '—'}</td>
                <td className="num hidden sm:table-cell">{brl(total(parcelas, 'faturada', 'recebida'))}</td>
                <td className="num hidden text-warn sm:table-cell">{total(parcelas, 'liberada') ? brl(total(parcelas, 'liberada')) : ''}</td>
                {editar && (
                  <td className="text-right">
                    <Link href={`/financeiro/contratos/${processo.id}`} className="whitespace-nowrap text-sm font-medium text-brand-700 hover:underline">
                      {parcelas.length ? 'Editar' : 'Montar'}
                      <span className="hidden sm:inline">{parcelas.length ? ' parcelas' : ' contrato'}</span>
                    </Link>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </>
  )
}

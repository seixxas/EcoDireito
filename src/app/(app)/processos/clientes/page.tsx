import type { Metadata } from 'next'
import Link from 'next/link'
import { classeBotao } from '@/components/ui/form'
import { PageHeader } from '@/components/ui/page-header'
import { listarClientes } from '@/data/processos'
import { exigirArea } from '@/data/sessao'
import { pode } from '@/lib/permissoes'
import { LinkVoltar } from '../_components/link-voltar'

export const metadata: Metadata = { title: 'Clientes' }

export default async function PaginaClientes() {
  const [itens, usuario] = await Promise.all([listarClientes(), exigirArea('prazos')])
  const editar = pode(usuario.papel, 'prazos', 'editar')

  return (
    <>
      <LinkVoltar href="/processos">Processos</LinkVoltar>
      <PageHeader
        titulo="Clientes"
        resumo={`${itens.length} clientes. O robô do Diário Oficial também procura pelo CNPJ de cada um.`}
        acoes={
          editar && (
            <Link href="/processos/clientes/novo" className={classeBotao()}>
              Novo cliente
            </Link>
          )
        }
      />
      <table className="tabela">
        <thead>
          <tr>
            <th>Cliente</th>
            <th>CNPJ ou CPF</th>
            <th>Grupo econômico</th>
            <th className="num">Processos</th>
            {editar && <th />}
          </tr>
        </thead>
        <tbody>
          {itens.map(({ cliente, processos }) => (
            <tr key={cliente.id}>
              <td className="font-medium">{cliente.nome}</td>
              <td className="whitespace-nowrap tabular-nums">{cliente.documento}</td>
              <td className="text-muted">{cliente.grupo ?? '—'}</td>
              <td className="num">{processos}</td>
              {editar && (
                <td className="text-right">
                  <Link href={`/processos/clientes/${cliente.id}`} className="text-sm font-medium text-brand-700 hover:underline">
                    Editar
                  </Link>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </>
  )
}

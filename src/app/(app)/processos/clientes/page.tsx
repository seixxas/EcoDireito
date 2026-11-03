import type { Metadata } from 'next'
import Link from 'next/link'
import { Vazio } from '@/components/ui/expansivel'
import { classeBotao } from '@/components/ui/form'
import { Linha, Lista } from '@/components/ui/lista'
import { PageHeader } from '@/components/ui/page-header'
import { Paginacao } from '@/components/ui/paginacao'
import { listarClientes } from '@/data/processos'
import { exigirArea } from '@/data/sessao'
import { contar } from '@/lib/formatar'
import { paginar } from '@/lib/paginar'
import { pode } from '@/lib/permissoes'
import { LinkVoltar } from '../_components/link-voltar'

export const metadata: Metadata = { title: 'Clientes' }

export default async function PaginaClientes({ searchParams }: { searchParams: Promise<{ pagina?: string }> }) {
  const [{ pagina }, itens, usuario] = await Promise.all([searchParams, listarClientes(), exigirArea('prazos')])
  const editar = pode(usuario.papel, 'prazos', 'editar')
  const paginado = paginar(itens, pagina)

  return (
    <>
      <LinkVoltar href="/processos">Processos</LinkVoltar>
      <PageHeader
        titulo="Clientes"
        resumo={`${contar(itens.length, 'cliente', 'clientes')}. O robô do Diário Oficial também procura pelo CNPJ de cada um.`}
        acoes={
          editar && (
            <Link href="/processos/clientes/novo" className={classeBotao()}>
              Novo cliente
            </Link>
          )
        }
      />
      <Lista>
        {paginado.itens.map(({ cliente, processos }) => (
          <Linha key={cliente.id} href={editar ? `/processos/clientes/${cliente.id}` : undefined}>
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium text-ink">{cliente.nome}</p>
              <p className="truncate text-xs tabular-nums text-muted">
                {cliente.documento}
                {cliente.grupo && ` · ${cliente.grupo}`}
              </p>
            </div>
            <span className="shrink-0 text-sm tabular-nums text-muted">{contar(processos, 'processo', 'processos')}</span>
          </Linha>
        ))}
      </Lista>
      {itens.length === 0 && <Vazio>Nenhum cliente cadastrado.</Vazio>}
      <Paginacao {...paginado} href={(n) => (n > 1 ? `/processos/clientes?pagina=${n}` : '/processos/clientes')} />
    </>
  )
}

import type { Metadata } from 'next'
import { LinkRapido } from '@/components/ui/link-rapido'
import { Busca } from '@/components/ui/busca'
import { Vazio } from '@/components/ui/expansivel'
import { classeBotao } from '@/components/ui/form'
import { Linha, Lista } from '@/components/ui/lista'
import { PageHeader } from '@/components/ui/page-header'
import { Paginacao } from '@/components/ui/paginacao'
import { listarClientes } from '@/data/processos'
import { exigirArea } from '@/data/sessao'
import { combina } from '@/lib/buscar'
import { contar } from '@/lib/formatar'
import { paginar } from '@/lib/paginar'
import { pode } from '@/lib/permissoes'
import { LinkVoltar } from '../_components/link-voltar'

export const metadata: Metadata = { title: 'Clientes' }

function endereco(q?: string, pagina = 1) {
  const busca = new URLSearchParams()
  if (q) busca.set('q', q)
  if (pagina > 1) busca.set('pagina', String(pagina))
  return busca.size ? `/projetos/clientes?${busca}` : '/projetos/clientes'
}

export default async function PaginaClientes({ searchParams }: { searchParams: Promise<{ q?: string; pagina?: string }> }) {
  const [{ q: buscado, pagina }, itens, usuario] = await Promise.all([searchParams, listarClientes(), exigirArea('prazos')])
  const editar = pode(usuario.papel, 'prazos', 'editar')
  const q = String(buscado ?? '').trim() || undefined
  // O CNPJ também vale digitado só com números.
  const achados = itens.filter(({ cliente: c }) => combina(q, c.nome, c.documento, c.documento.replace(/\D/g, ''), c.grupo))
  const paginado = paginar(achados, pagina)

  return (
    <>
      <LinkVoltar href="/projetos">Projetos</LinkVoltar>
      <PageHeader
        titulo="Clientes"
        resumo={`${contar(itens.length, 'cliente', 'clientes')}. O robô do Diário Oficial também procura pelo CNPJ de cada um.`}
        acoes={
          editar && (
            <LinkRapido href="/projetos/clientes/novo" className={classeBotao()}>
              Novo cliente
            </LinkRapido>
          )
        }
      />
      <Busca valor={q} placeholder="Nome, CNPJ ou grupo" limpar={endereco()} className="mb-4" />
      <Lista>
        {paginado.itens.map(({ cliente, processos }) => (
          <Linha key={cliente.id} href={editar ? `/projetos/clientes/${cliente.id}` : undefined}>
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium text-ink">{cliente.nome}</p>
              <p className="truncate text-xs tabular-nums text-muted">
                {cliente.documento}
                {cliente.grupo && ` · ${cliente.grupo}`}
              </p>
            </div>
            <span className="shrink-0 text-sm tabular-nums text-muted">{contar(processos, 'projeto', 'projetos')}</span>
          </Linha>
        ))}
      </Lista>
      {paginado.total === 0 && <Vazio>{q ? 'Nenhum cliente com essa busca.' : 'Nenhum cliente cadastrado.'}</Vazio>}
      <Paginacao {...paginado} href={(n) => endereco(q, n)} />
    </>
  )
}

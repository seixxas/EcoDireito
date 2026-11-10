import type { Metadata } from 'next'
import { LinkRapido } from '@/components/ui/link-rapido'
import { Busca } from '@/components/ui/busca'
import { Vazio } from '@/components/ui/expansivel'
import { classeBotao } from '@/components/ui/form'
import { Linha, Lista } from '@/components/ui/lista'
import { PageHeader } from '@/components/ui/page-header'
import { Paginacao } from '@/components/ui/paginacao'
import { listarClientes, listarProcessos } from '@/data/processos'
import { exigirArea } from '@/data/sessao'
import { combina } from '@/lib/buscar'
import { cn } from '@/lib/cn'
import { contar } from '@/lib/formatar'
import { paginar } from '@/lib/paginar'
import { pode } from '@/lib/permissoes'

export const metadata: Metadata = { title: 'Clientes' }

const COLUNAS = '@[44rem]:grid @[44rem]:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_6rem]'

function endereco(q?: string, pagina = 1) {
  const busca = new URLSearchParams()
  if (q) busca.set('q', q)
  if (pagina > 1) busca.set('pagina', String(pagina))
  return busca.size ? `/projetos/clientes?${busca}` : '/projetos/clientes'
}

export default async function PaginaClientes({ searchParams }: { searchParams: Promise<{ q?: string; pagina?: string }> }) {
  const [{ q: buscado, pagina }, itens, projetos, usuario] = await Promise.all([searchParams, listarClientes(), listarProcessos(), exigirArea('prazos')])
  const editar = pode(usuario.papel, 'prazos', 'editar')
  const q = String(buscado ?? '').trim() || undefined
  // O CNPJ também vale digitado só com números.
  const achados = itens.filter(({ cliente: c }) => combina(q, c.nome, c.documento, c.documento.replace(/\D/g, ''), c.grupo))
  const paginado = paginar(achados, pagina)

  return (
    <>
      <PageHeader
        voltar={{ href: '/projetos', rotulo: 'Voltar para Projetos' }}
        titulo="Clientes"
        resumo={`${contar(itens.length, 'cliente', 'clientes')}. O robô do Diário Oficial também procura pelo CNPJ de cada um.`}
        acoes={
          editar && (
            <LinkRapido href="/projetos/clientes/novo" className={classeBotao('primario')}>
              + Novo cliente
            </LinkRapido>
          )
        }
      />
      <Busca valor={q} placeholder="Nome, CNPJ ou grupo" limpar={endereco()} className="mb-4" />
      {paginado.total > 0 ? (
        <Lista className="@container">
          <li aria-hidden className={cn('hidden gap-x-3 px-3 pb-1 pt-1.5 text-xs font-semibold text-subtle', COLUNAS)}>
            <span>Cliente</span>
            <span>Projetos</span>
          </li>
          {paginado.itens.map(({ cliente, processos }) => (
            <Linha key={cliente.id} className={cn('relative', COLUNAS, editar && 'hover:bg-brand-50')}>
              <div className="min-w-0 basis-full">
                <p className="text-sm font-semibold leading-snug text-ink">{cliente.nome}</p>
                {/* CNPJ e grupo ficam no cadastro do cliente; a busca continua achando por eles. */}
                <p className="mt-0.5 text-xs text-muted">{contar(processos, 'projeto', 'projetos')}</p>
              </div>
              <ul className="min-w-0 basis-full space-y-2">
                {projetos
                  .filter(({ processo }) => processo.clienteId === cliente.id)
                  .map(({ processo }) => (
                    <li key={processo.id}>
                      <LinkRapido href={`/projetos/${processo.id}`} className="link relative z-10 inline-flex min-h-8 items-center text-base">
                        {processo.empreendimento}
                      </LinkRapido>
                    </li>
                  ))}
              </ul>
              {editar && (
                // A linha toda continua abrindo o cliente: o `after` estica o clique, e os links dos projetos ficam por cima dele.
                <LinkRapido href={`/projetos/clientes/${cliente.id}`} className={classeBotao('secundario', 'ml-auto after:absolute after:inset-0')}>
                  Abrir
                </LinkRapido>
              )}
            </Linha>
          ))}
        </Lista>
      ) : (
        <Vazio>{q ? 'Nenhum cliente com essa busca.' : 'Nenhum cliente cadastrado.'}</Vazio>
      )}
      <Paginacao {...paginado} href={(n) => endereco(q, n)} />
    </>
  )
}

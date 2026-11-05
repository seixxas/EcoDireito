import type { Metadata } from 'next'
import { LinkRapido } from '@/components/ui/link-rapido'
import { Busca } from '@/components/ui/busca'
import { Card } from '@/components/ui/card'
import { Vazio } from '@/components/ui/expansivel'
import { PageHeader } from '@/components/ui/page-header'
import { Paginacao } from '@/components/ui/paginacao'
import { ItemResumo, Resumo } from '@/components/ui/resumo'
import { listarContratos } from '@/data/financeiro'
import { exigirArea } from '@/data/sessao'
import type { SituacaoParcela } from '@/domain/financeiro/parcelas'
import { combina } from '@/lib/buscar'
import { somar } from '@/lib/dinheiro'
import { brl, contar } from '@/lib/formatar'
import { paginar } from '@/lib/paginar'
import { pode } from '@/lib/permissoes'

export const metadata: Metadata = { title: 'Contratos' }

type Item = Awaited<ReturnType<typeof listarContratos>>[number]['parcelas'][number]

const total = (parcelas: Item[], ...situacoes: SituacaoParcela[]) =>
  somar(parcelas.filter((p) => !situacoes.length || situacoes.includes(p.situacao)).map((p) => p.parcela.valor))

export default async function PaginaContratos({ searchParams }: { searchParams: Promise<{ q?: string; pagina?: string }> }) {
  const [filtros, usuario, contratos] = await Promise.all([searchParams, exigirArea('financeiro'), listarContratos()])
  const editar = pode(usuario.papel, 'financeiro', 'editar')
  // Só conta o que foi aceito. Proposta em aberto fica numa linha à parte (o funil está no Comercial); recusada some.
  const fechados = contratos.filter((c) => c.situacao === 'fechado')
  const emAberto = contratos.filter((c) => c.situacao === 'proposta').flatMap((c) => c.parcelas)
  const propostasEmAberto = contratos.filter((c) => c.situacao === 'proposta' && c.parcelas.length).length
  const todas = fechados.flatMap((c) => c.parcelas)
  const q = filtros.q?.trim() || undefined
  const encontrados = fechados.filter(({ processo, cliente }) => combina(q, processo.empreendimento, cliente.nome, cliente.grupo, processo.numeroSei))
  const paginado = paginar(encontrados, filtros.pagina)
  const link = (pagina: number) => {
    const params = new URLSearchParams({ ...(q && { q }), ...(pagina > 1 && { pagina: String(pagina) }) })
    return params.size ? `/financeiro/contratos?${params}` : '/financeiro/contratos'
  }

  return (
    <>
      <PageHeader
        titulo="Contratos"
        resumo={`${brl(total(todas, 'liberada'))} pronto para faturar. A parcela fica pronta quando o evento dela é lançado no projeto.`}
      />

      <Resumo className="mb-6">
        <ItemResumo rotulo="Contratado" valor={brl(total(todas))} detalhe={contar(fechados.filter((c) => c.parcelas.length).length, 'contrato', 'contratos')} />
        <ItemResumo rotulo="Faturado" valor={brl(total(todas, 'faturada', 'recebida'))} tom="ok" />
        <ItemResumo rotulo="Pronto para faturar" valor={brl(total(todas, 'liberada'))} detalhe="evento já aconteceu" tom="warn" />
        <ItemResumo rotulo="Aguardando evento" valor={brl(total(todas, 'aguardando'))} />
      </Resumo>
      {propostasEmAberto > 0 && (
        <p className="-mt-3 mb-6 text-sm text-muted">
          Fora destes totais: {brl(total(emAberto))} em {contar(propostasEmAberto, 'proposta em aberto', 'propostas em aberto')}, que entram aqui quando o cliente aceita
          {pode(usuario.papel, 'comercial') ? (
            <>
              {' '}
              (
              <LinkRapido href="/comercial" className="link">
                ver no Comercial
              </LinkRapido>
              ).
            </>
          ) : (
            '.'
          )}
        </p>
      )}

      <Busca valor={q} placeholder="Buscar projeto, cliente, grupo ou nº SEI" limpar="/financeiro/contratos" className="mb-3" />
      <Card flush>
        <table className="tabela">
          <thead>
            <tr>
              <th>Projeto</th>
              <th className="hidden sm:table-cell">Serviço</th>
              <th className="num hidden sm:table-cell">Parcelas</th>
              <th className="num">Contrato</th>
              <th className="num hidden sm:table-cell">Faturado</th>
              <th className="num hidden sm:table-cell">A faturar</th>
              {editar && <th />}
            </tr>
          </thead>
          <tbody>
            {paginado.itens.map(({ processo, cliente, parcelas }) => (
              <tr key={processo.id}>
                <td className="sm:min-w-64">
                  <LinkRapido href={`/projetos/${processo.id}`} className="link font-medium">
                    {processo.empreendimento}
                  </LinkRapido>
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
                    <LinkRapido href={`/financeiro/contratos/${processo.id}`} className="link whitespace-nowrap text-sm font-medium">
                      {parcelas.length ? 'Editar' : 'Montar'}
                      <span className="hidden sm:inline">{parcelas.length ? ' parcelas' : ' contrato'}</span>
                    </LinkRapido>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
        {encontrados.length === 0 && <Vazio>Nenhum projeto com “{q}”.</Vazio>}
      </Card>
      <Paginacao {...paginado} href={link} />
    </>
  )
}

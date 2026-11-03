import type { Metadata } from 'next'
import Link from 'next/link'
import { SituacaoPrazo } from '@/components/prazos/situacao-prazo'
import { FaseProgresso } from '@/components/processos/fase-progresso'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { classeBotao } from '@/components/ui/form'
import { PageHeader } from '@/components/ui/page-header'
import { hoje } from '@/data/hoje'
import { listarProcessos } from '@/data/processos'
import { exigirArea } from '@/data/sessao'
import { formatarDiaEData } from '@/lib/formatar'
import { pode } from '@/lib/permissoes'

export const metadata: Metadata = { title: 'Processos' }

export default async function PaginaProcessos() {
  const [dia, itens, usuario] = await Promise.all([hoje(), listarProcessos(), exigirArea('prazos')])
  const ordenados = [...itens].sort((a, b) => (a.proximo?.vencimento ?? '9999').localeCompare(b.proximo?.vencimento ?? '9999'))

  return (
    <>
      <PageHeader
        titulo="Processos"
        descricao={`${itens.length} processos na Secretaria do Verde, ordenados pelo próximo prazo.`}
        acoes={
          <div className="flex gap-2">
            <Link href="/processos/clientes" className={classeBotao('secundario')}>
              Clientes
            </Link>
            {pode(usuario.papel, 'prazos', 'editar') && (
              <Link href="/processos/novo" className={classeBotao()}>
                Novo processo
              </Link>
            )}
          </div>
        }
      />
      <Card flush>
        <table className="tabela">
          <thead>
            <tr>
              <th>Empreendimento</th>
              <th>Processo</th>
              <th>Fase</th>
              <th>Próximo prazo</th>
              <th>Responsável</th>
            </tr>
          </thead>
          <tbody>
            {ordenados.map(({ processo, cliente, proximo }) => (
              <tr key={processo.id}>
                <td className="min-w-64">
                  <Link href={`/processos/${processo.id}`} className="font-medium text-brand-700 hover:underline">
                    {processo.empreendimento}
                  </Link>
                  <p className="text-xs text-muted">{cliente.nome}</p>
                </td>
                <td className="whitespace-nowrap text-xs">
                  <p className="font-mono text-ink">SEI {processo.numeroSei}</p>
                  {processo.numeroSimproc && <p className="font-mono text-subtle">SIMPROC {processo.numeroSimproc}</p>}
                  <Badge tom="brand" className="mt-1">
                    {processo.servico === 'manejo' ? 'Manejo' : 'Licenciamento'}
                  </Badge>
                </td>
                <td>
                  <FaseProgresso fase={processo.faseAtual} />
                </td>
                <td className="min-w-60">
                  {proximo ? (
                    <>
                      <p className="font-medium">{proximo.regra.titulo}</p>
                      <p className="mt-1 flex items-center gap-2 text-xs text-muted">
                        {formatarDiaEData(proximo.vencimento)} <SituacaoPrazo prazo={proximo} hoje={dia} />
                      </p>
                    </>
                  ) : (
                    <span className="text-sm text-subtle">Nenhum prazo em aberto</span>
                  )}
                </td>
                <td className="whitespace-nowrap text-muted">{processo.responsavel}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </>
  )
}

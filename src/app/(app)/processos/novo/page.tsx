import type { Metadata } from 'next'
import Link from 'next/link'
import { Card } from '@/components/ui/card'
import { classeBotao } from '@/components/ui/form'
import { PageHeader } from '@/components/ui/page-header'
import { listarClientes } from '@/data/processos'
import { obterPublicacao } from '@/data/publicacoes'
import { exigirArea } from '@/data/sessao'
import { EVENTOS } from '@/domain/processos'
import { formatarData } from '@/lib/formatar'
import { FormularioProcesso } from '../_components/formulario-processo'
import { LinkVoltar } from '../_components/link-voltar'

export const metadata: Metadata = { title: 'Novo processo' }

/** `?ato=<id>` abre o cadastro a partir de um ato do Diário Oficial (cliente e nº SEI já preenchidos). */
export default async function PaginaNovoProcesso({ searchParams }: { searchParams: Promise<{ ato?: string }> }) {
  await exigirArea('prazos', 'editar')
  const { ato } = await searchParams
  const [clientes, publicacao] = await Promise.all([listarClientes(), ato ? obterPublicacao(ato) : undefined])
  const daqui = ato ? `/processos/novo?ato=${encodeURIComponent(ato)}` : '/processos/novo'

  return (
    <>
      {publicacao ? <LinkVoltar href="/publicacoes">Diário Oficial</LinkVoltar> : <LinkVoltar href="/processos">Processos</LinkVoltar>}
      <PageHeader
        titulo="Novo processo"
        descricao={
          publicacao
            ? `A partir do ato de ${formatarData(publicacao.ato.data)} (${publicacao.ato.serie}). Depois de salvar, você volta ao Diário Oficial para confirmar o ato.`
            : 'Com o processo cadastrado, o sistema calcula os prazos e acha os atos dele no Diário Oficial.'
        }
        acoes={
          <Link href={`/processos/clientes/novo?voltar=${encodeURIComponent(daqui)}`} className={classeBotao('secundario')}>
            Cliente novo
          </Link>
        }
      />
      <Card>
        <FormularioProcesso
          clientes={clientes.map(({ cliente }) => ({ id: cliente.id, nome: cliente.nome }))}
          valores={{
            clienteId: publicacao?.cliente.id,
            numeroSei: publicacao?.ato.processo,
            faseAtual: publicacao?.evento && EVENTOS[publicacao.evento].fase,
          }}
          voltar={publicacao && '/publicacoes'}
        />
      </Card>
    </>
  )
}

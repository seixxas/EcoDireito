import type { Metadata } from 'next'
import { LinkRapido } from '@/components/ui/link-rapido'
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

export const metadata: Metadata = { title: 'Novo projeto' }

/** `?ato=<id>` abre o cadastro a partir de um ato do Diário Oficial (cliente e nº SEI já preenchidos). */
export default async function PaginaNovoProcesso({ searchParams }: { searchParams: Promise<{ ato?: string; cliente?: string }> }) {
  await exigirArea('prazos', 'editar')
  const { ato, cliente } = await searchParams
  const [clientes, publicacao] = await Promise.all([listarClientes(), ato ? obterPublicacao(ato) : undefined])
  const daqui = ato ? `/projetos/novo?ato=${encodeURIComponent(ato)}` : '/projetos/novo'

  return (
    <>
      {publicacao ? <LinkVoltar href="/publicacoes">Diário Oficial</LinkVoltar> : <LinkVoltar href="/projetos">Projetos</LinkVoltar>}
      <PageHeader
        titulo="Novo projeto"
        resumo={
          publicacao
            ? `A partir do ato de ${formatarData(publicacao.ato.data)} (${publicacao.ato.serie}). Ao cadastrar, ${
                publicacao.evento ? `o ato é lançado no projeto (marca a etapa “${EVENTOS[publicacao.evento].nome}”)` : 'o ato fica registrado como visto'
              } e você volta ao Diário Oficial. Mantenha o nº SEI do ato: é por ele que o robô liga os atos ao projeto.`
            : 'Para um cliente novo, comece pela proposta, em Comercial. Aqui é para cadastrar um projeto que já anda na SVMA.'
        }
        acoes={
          <LinkRapido href={`/projetos/clientes/novo?voltar=${encodeURIComponent(daqui)}`} className={classeBotao('secundario')}>
            Cliente novo
          </LinkRapido>
        }
      />
      <Card>
        <FormularioProcesso
          clientes={clientes.map(({ cliente }) => ({ id: cliente.id, nome: cliente.nome }))}
          valores={{
            clienteId: publicacao?.cliente.id ?? cliente,
            numeroSei: publicacao?.ato.processo,
            faseAtual: publicacao?.evento && EVENTOS[publicacao.evento].fase,
          }}
          voltar={publicacao && '/publicacoes'}
          ato={publicacao && { id: publicacao.ato.id, enviar: publicacao.evento ? 'Cadastrar o projeto e lançar' : 'Cadastrar o projeto' }}
        />
      </Card>
    </>
  )
}

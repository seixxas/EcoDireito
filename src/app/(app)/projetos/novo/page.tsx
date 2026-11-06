import type { Metadata } from 'next'
import { PageHeader } from '@/components/ui/page-header'
import { Zona } from '@/components/ui/zona'
import { listarClientes } from '@/data/processos'
import { obterPublicacao } from '@/data/publicacoes'
import { exigirArea } from '@/data/sessao'
import { EVENTOS } from '@/domain/processos'
import { formatarData } from '@/lib/formatar'
import { FormularioProcesso } from '../_components/formulario-processo'

export const metadata: Metadata = { title: 'Novo projeto' }

/** `?ato=<id>` abre o cadastro a partir de um ato do Diário Oficial (cliente e nº SEI já preenchidos). */
export default async function PaginaNovoProcesso({ searchParams }: { searchParams: Promise<{ ato?: string; cliente?: string }> }) {
  await exigirArea('prazos', 'editar')
  const { ato, cliente } = await searchParams
  const [clientes, publicacao] = await Promise.all([listarClientes(), ato ? obterPublicacao(ato) : undefined])
  const daqui = ato ? `/projetos/novo?ato=${encodeURIComponent(ato)}` : '/projetos/novo'

  return (
    <div className="max-w-6xl">
      <PageHeader
        voltar={publicacao ? { href: '/publicacoes', rotulo: 'Voltar para o Diário Oficial' } : { href: '/projetos', rotulo: 'Voltar para Projetos' }}
        titulo="Novo projeto"
        resumo={
          publicacao
            ? `A partir do ato de ${formatarData(publicacao.ato.data)} (${publicacao.ato.serie}).`
            : 'Quando uma proposta é aprovada, o projeto já nasce na fase Documentação. Use esta tela para projetos que não vieram de proposta.'
        }
      />
      {publicacao && (
        <Zona tom="diario" titulo="Ao cadastrar" className="pb-3.5!">
          <p>
            {publicacao.evento ? `O ato é lançado no projeto (marca a etapa “${EVENTOS[publicacao.evento].nome}”)` : 'O ato fica registrado como visto'} e você volta ao Diário Oficial. Mantenha o nº SEI do
            ato: é por ele que o robô liga os atos ao projeto.
          </p>
        </Zona>
      )}
      <FormularioProcesso
        clientes={clientes.map(({ cliente }) => ({ id: cliente.id, nome: cliente.nome }))}
        valores={{
          clienteId: publicacao?.cliente.id ?? cliente,
          numeroSei: publicacao?.ato.processo,
          faseAtual: publicacao?.evento && EVENTOS[publicacao.evento].fase,
        }}
        cancelar={publicacao ? '/publicacoes' : '/projetos'}
        novoCliente={`/projetos/clientes/novo?voltar=${encodeURIComponent(daqui)}`}
        voltar={publicacao && '/publicacoes'}
        ato={publicacao && { id: publicacao.ato.id, enviar: publicacao.evento ? 'Cadastrar o projeto e lançar' : 'Cadastrar o projeto' }}
      />
    </div>
  )
}

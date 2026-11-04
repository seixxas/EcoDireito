import { Abas } from '@/components/ui/abas'
import { hoje } from '@/data/hoje'
import { listarPrazos } from '@/data/processos'
import { listarPublicacoes } from '@/data/publicacoes'
import { estaAberto } from '@/domain/prazos'

/** As três telas do item Hoje. Os números são o que espera alguém: atos a revisar e prazos nossos em aberto. */
export async function AbasDoDia({ ativa }: { ativa: 'fazer' | 'diario' | 'prazos' }) {
  const [dia, prazos, { itens }] = await Promise.all([hoje(), listarPrazos(), listarPublicacoes()])
  return (
    <Abas
      ativa={ativa}
      abas={[
        { valor: 'fazer', rotulo: 'Para fazer', href: '/' },
        { valor: 'diario', rotulo: 'Diário Oficial', href: '/publicacoes', contagem: itens.filter(({ ato }) => ato.status === 'nova').length },
        { valor: 'prazos', rotulo: 'Prazos', href: '/prazos', contagem: prazos.filter((p) => p.regra.tipo !== 'expectativa' && estaAberto(p, dia)).length },
      ]}
    />
  )
}

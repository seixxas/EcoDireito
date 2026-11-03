import type { Metadata } from 'next'
import { LinhaPrazo } from '@/components/prazos/linha-prazo'
import { Vazio } from '@/components/ui/expansivel'
import { Lista } from '@/components/ui/lista'
import { PageHeader } from '@/components/ui/page-header'
import { Paginacao } from '@/components/ui/paginacao'
import { Secao } from '@/components/ui/secao'
import { SegmentedLinks } from '@/components/ui/segmented-links'
import { hoje } from '@/data/hoje'
import { listarPrazos, type PrazoComProcesso } from '@/data/processos'
import { PERIODOS, estaAberto, periodoDoPrazo, type Periodo } from '@/domain/prazos'
import { contar } from '@/lib/formatar'
import { paginar } from '@/lib/paginar'

export const metadata: Metadata = { title: 'Prazos' }

const VISTAS = { nossos: 'Nossos prazos', orgao: 'Aguardando a SVMA', cumpridos: 'Cumpridos' } as const
type Vista = keyof typeof VISTAS

function frase(vencidos: number, semana: number) {
  const atrasados = vencidos ? contar(vencidos, 'prazo vencido', 'prazos vencidos') : 'Nenhum prazo vencido'
  const proximos = semana ? contar(semana, 'vence', 'vencem') : 'nenhum vence'
  return `${atrasados} e ${proximos} nesta semana.`
}

function endereco(vista: Vista, pagina = 1) {
  const busca = new URLSearchParams()
  if (vista !== 'nossos') busca.set('filtro', vista)
  if (pagina > 1) busca.set('pagina', String(pagina))
  return busca.size ? `/prazos?${busca}` : '/prazos'
}

export default async function PaginaPrazos({ searchParams }: { searchParams: Promise<{ filtro?: string; pagina?: string }> }) {
  const { filtro, pagina } = await searchParams
  const vista: Vista = filtro && filtro in VISTAS ? (filtro as Vista) : 'nossos'
  const [dia, prazos] = await Promise.all([hoje(), listarPrazos()])

  const abertos = prazos.filter((p) => estaAberto(p, dia))
  const listas: Record<Vista, PrazoComProcesso[]> = {
    nossos: abertos.filter((p) => p.regra.tipo !== 'expectativa'),
    orgao: abertos.filter((p) => p.regra.tipo === 'expectativa'),
    cumpridos: prazos.filter((p) => !estaAberto(p, dia)).sort((a, b) => (b.cumpridoEm ?? '').localeCompare(a.cumpridoEm ?? '')),
  }
  const periodosNossos = listas.nossos.map((p) => periodoDoPrazo(p.vencimento, dia))
  const paginado = paginar(listas[vista], pagina)
  const linha = (prazo: PrazoComProcesso) => <LinhaPrazo key={prazo.id} prazo={prazo} hoje={dia} processo={prazo.processo} cliente={prazo.cliente} />

  return (
    <>
      <PageHeader
        titulo="Prazos"
        resumo={frase(periodosNossos.filter((p) => p === 'vencidos').length, periodosNossos.filter((p) => p === 'semana').length)}
      />
      <div className="mb-6">
        <SegmentedLinks
          ativo={vista}
          opcoes={Object.entries(VISTAS).map(([valor, rotulo]) => ({
            valor,
            rotulo,
            href: endereco(valor as Vista),
            contagem: listas[valor as Vista].length,
          }))}
        />
      </div>

      {vista === 'cumpridos' ? (
        <Lista>{paginado.itens.map(linha)}</Lista>
      ) : (
        // A página corta a lista em ordem de vencimento; os blocos agrupam só o que está nela.
        (Object.keys(PERIODOS) as Periodo[]).map((periodo) => {
          const doPeriodo = paginado.itens.filter((p) => periodoDoPrazo(p.vencimento, dia) === periodo)
          if (doPeriodo.length === 0) return null
          return (
            <Secao key={periodo} titulo={vista === 'orgao' && periodo === 'vencidos' ? 'Atrasados' : PERIODOS[periodo]}>
              <Lista>{doPeriodo.map(linha)}</Lista>
            </Secao>
          )
        })
      )}
      {paginado.total === 0 && <Vazio>Nenhum prazo aqui.</Vazio>}
      <Paginacao {...paginado} href={(n) => endereco(vista, n)} />
    </>
  )
}

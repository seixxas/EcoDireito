import type { Metadata } from 'next'
import { LinhaPrazo } from '@/components/prazos/linha-prazo'
import { Expansivel, Vazio } from '@/components/ui/expansivel'
import { Lista } from '@/components/ui/lista'
import { PageHeader } from '@/components/ui/page-header'
import { Secao } from '@/components/ui/secao'
import { SegmentedLinks } from '@/components/ui/segmented-links'
import { hoje } from '@/data/hoje'
import { listarPrazos, type PrazoComProcesso } from '@/data/processos'
import { PERIODOS, estaAberto, periodoDoPrazo, type Periodo } from '@/domain/prazos'
import { contar } from '@/lib/formatar'

export const metadata: Metadata = { title: 'Prazos' }

const VISTAS = { nossos: 'Nossos prazos', orgao: 'Aguardando a SVMA', cumpridos: 'Cumpridos' } as const
type Vista = keyof typeof VISTAS

/** Cumpridos são histórico: só os mais recentes. */
const CUMPRIDOS_NA_TELA = 20

function frase(vencidos: number, semana: number) {
  const atrasados = vencidos ? contar(vencidos, 'prazo vencido', 'prazos vencidos') : 'Nenhum prazo vencido'
  const proximos = semana ? contar(semana, 'vence', 'vencem') : 'nenhum vence'
  return `${atrasados} e ${proximos} nesta semana.`
}

export default async function PaginaPrazos({ searchParams }: { searchParams: Promise<{ filtro?: string }> }) {
  const { filtro } = await searchParams
  const vista: Vista = filtro && filtro in VISTAS ? (filtro as Vista) : 'nossos'
  const [dia, prazos] = await Promise.all([hoje(), listarPrazos()])

  const abertos = prazos.filter((p) => estaAberto(p, dia))
  const listas: Record<Vista, PrazoComProcesso[]> = {
    nossos: abertos.filter((p) => p.regra.tipo !== 'expectativa'),
    orgao: abertos.filter((p) => p.regra.tipo === 'expectativa'),
    cumpridos: prazos.filter((p) => !estaAberto(p, dia)).sort((a, b) => (b.cumpridoEm ?? '').localeCompare(a.cumpridoEm ?? '')),
  }
  const periodosNossos = listas.nossos.map((p) => periodoDoPrazo(p.vencimento, dia))
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
            href: valor === 'nossos' ? '/prazos' : `/prazos?filtro=${valor}`,
            contagem: listas[valor as Vista].length,
          }))}
        />
      </div>

      {vista === 'cumpridos' ? (
        <Secao titulo={listas.cumpridos.length > CUMPRIDOS_NA_TELA ? `Os ${CUMPRIDOS_NA_TELA} mais recentes` : undefined}>
          <Lista>{listas.cumpridos.slice(0, CUMPRIDOS_NA_TELA).map(linha)}</Lista>
        </Secao>
      ) : (
        (Object.keys(PERIODOS) as Periodo[]).map((periodo) => {
          const doPeriodo = listas[vista].filter((p) => periodoDoPrazo(p.vencimento, dia) === periodo)
          if (doPeriodo.length === 0) return null
          const titulo = (
            <>
              {vista === 'orgao' && periodo === 'vencidos' ? 'Atrasados' : PERIODOS[periodo]}
              <span className="ml-2 font-normal tabular-nums text-subtle">{doPeriodo.length}</span>
            </>
          )
          return (
            <Secao key={periodo} titulo={titulo}>
              {periodo === 'adiante' ? (
                <Expansivel resumo={`Mostrar ${doPeriodo.length === 1 ? 'o prazo' : `os ${doPeriodo.length} prazos`}`}>
                  <Lista>{doPeriodo.map(linha)}</Lista>
                </Expansivel>
              ) : (
                <Lista>{doPeriodo.map(linha)}</Lista>
              )}
            </Secao>
          )
        })
      )}
      {listas[vista].length === 0 && <Vazio>Nenhum prazo aqui.</Vazio>}
    </>
  )
}

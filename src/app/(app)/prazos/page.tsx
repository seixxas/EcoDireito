import type { Metadata } from 'next'
import { AbasDoDia } from '@/components/layout/abas-do-dia'
import { LinhaPrazo } from '@/components/prazos/linha-prazo'
import { Busca } from '@/components/ui/busca'
import { Vazio } from '@/components/ui/expansivel'
import { PageHeader } from '@/components/ui/page-header'
import { Paginacao } from '@/components/ui/paginacao'
import { SegmentedLinks } from '@/components/ui/segmented-links'
import { Zona, type TomZona } from '@/components/ui/zona'
import { hoje } from '@/data/hoje'
import { listarPrazos, type PrazoComProcesso } from '@/data/processos'
import { PERIODOS, estaAberto, periodoDoPrazo, type Periodo } from '@/domain/prazos'
import { combina } from '@/lib/buscar'
import type { DataISO } from '@/lib/datas'
import { contar } from '@/lib/formatar'
import { paginar } from '@/lib/paginar'

export const metadata: Metadata = { title: 'Prazos' }

const VISTAS = { nossos: 'Nossos prazos', orgao: 'Aguardando a SVMA', cumpridos: 'Cumpridos' } as const
type Vista = keyof typeof VISTAS
type Filtros = { vista: Vista; responsavel?: string; q?: string; pagina?: number }

const TONS: Record<Periodo, TomZona> = { vencidos: 'atraso', semana: 'hoje', proximas: 'proximos', adiante: 'neutra' }
/** Atraso do órgão não é culpa da Eco Direito: amarelo de atenção, não vermelho. */
const TONS_DO_ORGAO: Record<Periodo, TomZona> = { vencidos: 'hoje', semana: 'neutra', proximas: 'neutra', adiante: 'neutra' }

const contarPrazos = (n: number) => contar(n, 'prazo', 'prazos')

function frase(vencidos: number, semana: number) {
  const atrasados = vencidos ? contar(vencidos, 'prazo vencido', 'prazos vencidos') : 'Nenhum prazo vencido'
  const proximos = semana ? contar(semana, 'vence', 'vencem') : 'nenhum vence'
  return `${atrasados} e ${proximos} nesta semana.`
}

function endereco({ vista, responsavel, q, pagina = 1 }: Filtros) {
  const busca = new URLSearchParams()
  if (vista !== 'nossos') busca.set('filtro', vista)
  if (responsavel) busca.set('responsavel', responsavel)
  if (q) busca.set('q', q)
  if (pagina > 1) busca.set('pagina', String(pagina))
  return busca.size ? `/prazos?${busca}` : '/prazos'
}

function separar(prazos: PrazoComProcesso[], dia: DataISO): Record<Vista, PrazoComProcesso[]> {
  const abertos = prazos.filter((p) => estaAberto(p, dia))
  return {
    nossos: abertos.filter((p) => p.regra.tipo !== 'expectativa'),
    orgao: abertos.filter((p) => p.regra.tipo === 'expectativa'),
    cumpridos: prazos.filter((p) => !estaAberto(p, dia)).sort((a, b) => (b.cumpridoEm ?? '').localeCompare(a.cumpridoEm ?? '')),
  }
}

export default async function PaginaPrazos({
  searchParams,
}: {
  searchParams: Promise<{ filtro?: string; responsavel?: string; q?: string; pagina?: string }>
}) {
  const { filtro, responsavel: pedido, q: buscado, pagina } = await searchParams
  const [dia, prazos] = await Promise.all([hoje(), listarPrazos()])

  const responsaveis = [...new Set(prazos.map((p) => p.processo.responsavel).filter(Boolean))].sort()
  const filtros: Filtros = {
    vista: filtro && filtro in VISTAS ? (filtro as Vista) : 'nossos',
    responsavel: responsaveis.find((r) => r === pedido),
    q: String(buscado ?? '').trim() || undefined,
  }
  const { vista, responsavel, q } = filtros

  const buscados = prazos.filter((p) =>
    combina(q, p.regra.titulo, p.processo.empreendimento, p.processo.numeroSei, p.processo.responsavel, p.cliente.nome, p.cliente.grupo),
  )
  const listas = separar(responsavel ? buscados.filter((p) => p.processo.responsavel === responsavel) : buscados, dia)
  const daVista = separar(buscados, dia)[vista]
  const periodosNossos = separar(prazos, dia).nossos.map((p) => periodoDoPrazo(p.vencimento, dia))
  const paginado = paginar(listas[vista], pagina)
  const linha = (prazo: PrazoComProcesso) => <LinhaPrazo key={prazo.id} prazo={prazo} hoje={dia} processo={prazo.processo} cliente={prazo.cliente} />

  return (
    <>
      <AbasDoDia ativa="prazos" />
      <PageHeader
        titulo="Prazos"
        resumo={frase(periodosNossos.filter((p) => p === 'vencidos').length, periodosNossos.filter((p) => p === 'semana').length)}
      />
      <div className="mb-5 flex flex-wrap items-end gap-x-4 gap-y-3">
        <SegmentedLinks
          rotulo="Quais prazos"
          ativo={vista}
          opcoes={Object.entries(VISTAS).map(([valor, rotulo]) => ({
            valor,
            rotulo,
            href: endereco({ ...filtros, vista: valor as Vista }),
            contagem: listas[valor as Vista].length,
          }))}
        />
        {responsaveis.length > 1 && (
          <SegmentedLinks
            rotulo="Responsável"
            ativo={responsavel ?? 'todos'}
            opcoes={[
              { valor: 'todos', rotulo: 'Todos', href: endereco({ ...filtros, responsavel: undefined }), contagem: daVista.length },
              ...responsaveis.map((r) => ({
                valor: r,
                rotulo: r.split(' ')[0],
                href: endereco({ ...filtros, responsavel: r }),
                contagem: daVista.filter((p) => p.processo.responsavel === r).length,
              })),
            ]}
          />
        )}
        <Busca
          valor={q}
          placeholder="Empresa, empreendimento ou prazo"
          manter={{ filtro: vista === 'nossos' ? undefined : vista, responsavel }}
          limpar={endereco({ ...filtros, q: undefined })}
          className="min-w-60"
        />
      </div>

      {vista === 'cumpridos'
        ? paginado.total > 0 && (
            <Zona tom="neutra" titulo="Cumpridos" detalhe={contarPrazos(paginado.total)}>
              <ul>{paginado.itens.map(linha)}</ul>
            </Zona>
          )
        : // A página corta a lista em ordem de vencimento; os blocos agrupam só o que está nela.
          (Object.keys(PERIODOS) as Periodo[]).map((periodo) => {
            const doPeriodo = paginado.itens.filter((p) => periodoDoPrazo(p.vencimento, dia) === periodo)
            if (doPeriodo.length === 0) return null
            return (
              <Zona
                key={periodo}
                tom={(vista === 'orgao' ? TONS_DO_ORGAO : TONS)[periodo]}
                titulo={vista === 'orgao' && periodo === 'vencidos' ? 'Atrasados' : PERIODOS[periodo]}
                detalhe={contarPrazos(listas[vista].filter((p) => periodoDoPrazo(p.vencimento, dia) === periodo).length)}
              >
                <ul>{doPeriodo.map(linha)}</ul>
              </Zona>
            )
          })}
      {paginado.total === 0 && <Vazio>{q || responsavel ? 'Nenhum prazo com esse filtro.' : 'Nenhum prazo aqui.'}</Vazio>}
      <Paginacao {...paginado} href={(n) => endereco({ ...filtros, pagina: n })} />
    </>
  )
}

import { ArrowRight } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { SituacaoPrazo } from '@/components/prazos/situacao-prazo'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { PageHeader } from '@/components/ui/page-header'
import { Stat } from '@/components/ui/stat'
import { projecaoDeCaixa, listarNotas } from '@/data/financeiro'
import { hoje } from '@/data/hoje'
import { listarParcelasLiberadas, listarPrazos } from '@/data/processos'
import { listarPublicacoes } from '@/data/publicacoes'
import { diasDeAtraso, resumoNotas, saldoAReceber, situacaoNota } from '@/domain/financeiro/notas'
import { DIAS_ALERTA, estaAberto } from '@/domain/prazos'
import { diasEntre, somarDias } from '@/lib/datas'
import { somar } from '@/lib/dinheiro'
import { brl, formatarDiaEData } from '@/lib/formatar'

export const metadata: Metadata = { title: 'Painel' }

function VerTodos({ href }: { href: string }) {
  return (
    <Link href={href} className="inline-flex items-center gap-1 text-sm font-medium text-brand-700 hover:underline">
      Ver todos <ArrowRight className="size-4" />
    </Link>
  )
}

export default async function Painel() {
  const [dia, prazos, publicacoes, { notas }, parcelas, caixa] = await Promise.all([
    hoje(),
    listarPrazos(),
    listarPublicacoes(),
    listarNotas(),
    listarParcelasLiberadas(),
    projecaoDeCaixa(),
  ])

  const abertos = prazos.filter((p) => p.regra.tipo !== 'expectativa' && estaAberto(p, dia))
  const vencidos = abertos.filter((p) => p.vencimento < dia)
  const proximos = abertos.filter((p) => p.vencimento >= dia && diasEntre(dia, p.vencimento) <= DIAS_ALERTA)
  const novas = publicacoes.itens.filter((item) => item.ato.status === 'nova')
  const ultimos30 = resumoNotas(notas.filter(({ nota }) => nota.emissao > somarDias(dia, -30)).map(({ nota }) => nota), dia)
  const geral = resumoNotas(notas.map(({ nota }) => nota), dia)
  const atrasadas = notas
    .filter(({ nota }) => situacaoNota(nota, dia) === 'atrasada')
    .sort((a, b) => a.nota.previsao.localeCompare(b.nota.previsao))

  return (
    <>
      <PageHeader titulo="Painel" descricao={`Hoje é ${formatarDiaEData(dia)}. O que pede atenção nos prazos e no financeiro.`} />

      <h2 className="mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-subtle">Prazos</h2>
      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat rotulo="Vencidos" valor={vencidos.length} detalhe="prazos da Eco Direito" tom={vencidos.length ? 'danger' : 'ok'} />
        <Stat rotulo={`Vencem em até ${DIAS_ALERTA} dias`} valor={proximos.length} detalhe={`${abertos.length} prazos em aberto no total`} tom="warn" />
        <Stat rotulo="Diário Oficial" valor={novas.length} detalhe="publicações para revisar" tom={novas.length ? 'info' : 'ok'} />
        <Stat rotulo="Prontas para faturar" valor={parcelas.length} detalhe={`${brl(somar(parcelas.map((p) => p.parcela.valor)))} em parcelas liberadas`} tom="warn" />
      </div>

      <h2 className="mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-subtle">Financeiro</h2>
      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat rotulo="Faturado em 30 dias" valor={brl(ultimos30.faturado)} detalhe={`${ultimos30.quantidade} notas emitidas`} tom="brand" />
        <Stat rotulo="A receber" valor={brl(geral.aReceber)} detalhe={`prazo mediano de ${geral.prazoMedianoDias} dias`} />
        <Stat rotulo="Atrasado" valor={brl(geral.atrasado)} detalhe={`${geral.quantidadeAtrasadas} notas passaram da previsão`} tom="danger" />
        <Stat rotulo="Saldo em conta" valor={brl(caixa.saldoHoje)} detalhe={`mais ${brl(caixa.aplicado)} aplicados`} />
      </div>

      <div className="grid gap-6 xl:grid-cols-5">
        <Card titulo="Prazos que pedem atenção" acao={<VerTodos href="/prazos" />} className="xl:col-span-3" flush>
          <ul className="divide-y divide-line">
            {[...vencidos, ...proximos].slice(0, 9).map((prazo) => (
              <li key={prazo.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-3">
                <div>
                  <p className="font-medium">{prazo.regra.titulo}</p>
                  <p className="text-xs text-muted">
                    <Link href={`/processos/${prazo.processo.id}`} className="text-brand-700 hover:underline">
                      {prazo.processo.empreendimento}
                    </Link>{' '}
                    · {prazo.processo.responsavel}
                  </p>
                </div>
                <div className="text-right">
                  <SituacaoPrazo prazo={prazo} hoje={dia} />
                  <p className="mt-1 text-xs text-muted">{formatarDiaEData(prazo.vencimento)}</p>
                </div>
              </li>
            ))}
          </ul>
        </Card>

        <div className="space-y-6 xl:col-span-2">
          <Card titulo={`Diário Oficial · ${formatarDiaEData(publicacoes.edicao.data)}`} acao={<VerTodos href="/publicacoes" />} flush>
            <ul className="divide-y divide-line">
              {novas.map(({ ato, cliente, processo }) => (
                <li key={ato.id} className="px-5 py-3">
                  <p className="flex items-center gap-2 text-sm font-medium">
                    <Badge tom="brand">{ato.serie}</Badge>
                  </p>
                  <p className="mt-1 text-sm">{processo?.empreendimento ?? cliente.nome}</p>
                  {!processo && <p className="text-xs text-warn">processo ainda não cadastrado</p>}
                </li>
              ))}
            </ul>
          </Card>

          <Card titulo="Prontas para faturar" flush>
            <ul className="divide-y divide-line">
              {parcelas.map(({ parcela, processo }) => (
                <li key={parcela.id} className="flex items-center justify-between gap-3 px-5 py-3">
                  <div>
                    <Link href={`/processos/${processo.id}`} className="text-sm font-medium text-brand-700 hover:underline">
                      {processo.empreendimento}
                    </Link>
                    <p className="text-xs text-muted">{parcela.descricao}</p>
                  </div>
                  <span className="font-semibold tabular-nums">{brl(parcela.valor)}</span>
                </li>
              ))}
            </ul>
          </Card>

          <Card titulo="Notas atrasadas" acao={<VerTodos href="/financeiro/receber" />} flush>
            <ul className="divide-y divide-line">
              {atrasadas.slice(0, 5).map(({ nota, cliente }) => (
                <li key={nota.id} className="flex items-center justify-between gap-3 px-5 py-3">
                  <div>
                    <p className="text-sm font-medium">{cliente.nome}</p>
                    <p className="text-xs text-muted">
                      NF {nota.numero} · {diasDeAtraso(nota, dia)} dias de atraso
                    </p>
                  </div>
                  <span className="font-semibold tabular-nums text-danger">{brl(saldoAReceber(nota, dia))}</span>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </div>
    </>
  )
}

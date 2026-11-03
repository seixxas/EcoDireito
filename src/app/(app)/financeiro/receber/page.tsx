import type { Metadata } from 'next'
import Link from 'next/link'
import { SituacaoNotaBadge } from '@/components/financeiro/situacao-nota'
import { Card } from '@/components/ui/card'
import { PageHeader } from '@/components/ui/page-header'
import { Stat } from '@/components/ui/stat'
import { listarNotas } from '@/data/financeiro'
import { diasDeAtraso, resumoNotas, saldoAReceber, situacaoNota } from '@/domain/financeiro/notas'
import { cn } from '@/lib/cn'
import { diasEntre } from '@/lib/datas'
import { somar } from '@/lib/dinheiro'
import { brl, formatarData } from '@/lib/formatar'

export const metadata: Metadata = { title: 'Contas a receber' }

const FAIXAS = [
  { rotulo: 'A vencer', de: -Infinity, ate: 0, cor: 'bg-brand-300' },
  { rotulo: '1 a 15 dias de atraso', de: 1, ate: 15, cor: 'bg-accent/50' },
  { rotulo: '16 a 30 dias', de: 16, ate: 30, cor: 'bg-accent' },
  { rotulo: '31 a 60 dias', de: 31, ate: 60, cor: 'bg-danger/70' },
  { rotulo: 'Mais de 60 dias', de: 61, ate: Infinity, cor: 'bg-danger' },
]

export default async function PaginaReceber() {
  const { hoje: dia, notas } = await listarNotas()
  const abertas = notas
    .filter(({ nota }) => saldoAReceber(nota, dia) > 0)
    .map((item) => ({ ...item, atraso: diasDeAtraso(item.nota, dia), saldo: saldoAReceber(item.nota, dia) }))
    .sort((a, b) => b.atraso - a.atraso || a.nota.previsao.localeCompare(b.nota.previsao))

  const resumo = resumoNotas(notas.map(({ nota }) => nota), dia)
  const total = somar(abertas.map((a) => a.saldo))
  const proximos30 = somar(abertas.filter((a) => a.atraso === 0 && diasEntre(dia, a.nota.previsao) <= 30).map((a) => a.saldo))
  const faixas = FAIXAS.map((faixa) => {
    const itens = abertas.filter((a) => a.atraso >= faixa.de && a.atraso <= faixa.ate)
    return { ...faixa, quantidade: itens.length, valor: somar(itens.map((a) => a.saldo)) }
  })

  const porGrupo = Object.entries(
    abertas.reduce<Record<string, number>>((grupos, { cliente, saldo }) => {
      const chave = cliente.grupo ? `Grupo ${cliente.grupo}` : cliente.nome
      grupos[chave] = (grupos[chave] ?? 0) + saldo
      return grupos
    }, {}),
  ).sort((a, b) => b[1] - a[1])

  return (
    <>
      <PageHeader titulo="Contas a receber" descricao="O que os clientes ainda devem, por tempo de atraso. Notas com retenção na fonte já aparecem pelo valor líquido." />

      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat rotulo="Total a receber" valor={brl(total)} detalhe={`${abertas.length} notas em aberto`} tom="brand" />
        <Stat rotulo="Atrasado" valor={brl(resumo.atrasado)} detalhe={`${resumo.quantidadeAtrasadas} notas`} tom="danger" />
        <Stat rotulo="Entra em 30 dias" valor={brl(proximos30)} detalhe="pela previsão de pagamento" tom="ok" />
        <Stat rotulo="Prazo para receber" valor={`${resumo.prazoMedianoDias} dias`} detalhe="mediana, da emissão ao pagamento" />
      </div>

      <div className="mb-6 grid gap-6 xl:grid-cols-5">
        <Card titulo="Por tempo de atraso" className="xl:col-span-3">
          <div className="flex h-3 overflow-hidden rounded-full bg-canvas">
            {faixas.map((faixa) => (
              <div key={faixa.rotulo} title={`${faixa.rotulo}: ${brl(faixa.valor)}`} className={faixa.cor} style={{ width: `${total ? (faixa.valor / total) * 100 : 0}%` }} />
            ))}
          </div>
          <ul className="mt-4 grid gap-x-6 gap-y-2 sm:grid-cols-2">
            {faixas.map((faixa) => (
              <li key={faixa.rotulo} className="flex items-baseline gap-2 text-sm">
                <span className={cn('size-2.5 shrink-0 translate-y-px rounded-full', faixa.cor)} />
                <span className="flex-1">
                  {faixa.rotulo} <span className="text-subtle">· {faixa.quantidade}</span>
                </span>
                <span className="font-medium tabular-nums">{brl(faixa.valor)}</span>
              </li>
            ))}
          </ul>
        </Card>
        <Card titulo="Por cliente ou grupo" className="xl:col-span-2" flush>
          <table className="tabela">
            <tbody>
              {porGrupo.slice(0, 8).map(([nome, valor]) => (
                <tr key={nome}>
                  <td>{nome}</td>
                  <td className="num font-medium">{brl(valor)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </div>

      <Card titulo="Notas em aberto" flush>
        <table className="tabela">
          <thead>
            <tr>
              <th>Cliente</th>
              <th>NF</th>
              <th>Emissão</th>
              <th>Previsão</th>
              <th className="num">Atraso</th>
              <th className="num">Saldo</th>
              <th>Situação</th>
            </tr>
          </thead>
          <tbody>
            {abertas.map(({ nota, cliente, atraso, saldo }) => (
              <tr key={nota.id}>
                <td className="min-w-60">
                  {cliente.nome}
                  <p className="text-xs text-subtle">{nota.descricao}</p>
                </td>
                <td className="font-mono text-xs">
                  <Link href={`/financeiro/notas/${nota.id}`} className="text-brand-700 hover:underline">
                    {nota.numero}
                  </Link>
                </td>
                <td className="whitespace-nowrap">{formatarData(nota.emissao)}</td>
                <td className="whitespace-nowrap">{formatarData(nota.previsao)}</td>
                <td className={cn('num', atraso > 30 ? 'font-semibold text-danger' : atraso > 0 && 'text-warn')}>{atraso ? `${atraso} dias` : '—'}</td>
                <td className="num font-medium">{brl(saldo)}</td>
                <td>
                  <SituacaoNotaBadge situacao={situacaoNota(nota, dia)} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </>
  )
}

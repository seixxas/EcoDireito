import type { Metadata } from 'next'
import Link from 'next/link'
import { SituacaoDaNota } from '@/components/financeiro/situacao-nota'
import { Card } from '@/components/ui/card'
import { Vazio } from '@/components/ui/expansivel'
import { Linha, Lista } from '@/components/ui/lista'
import { PageHeader } from '@/components/ui/page-header'
import { Paginacao } from '@/components/ui/paginacao'
import { ItemResumo, Resumo } from '@/components/ui/resumo'
import { Secao } from '@/components/ui/secao'
import { listarNotas } from '@/data/financeiro'
import { diasDeAtraso, resumoNotas, saldoAReceber, situacaoNota } from '@/domain/financeiro/notas'
import { cn } from '@/lib/cn'
import { diasEntre } from '@/lib/datas'
import { somar } from '@/lib/dinheiro'
import { brl, contar, formatarDataCurta } from '@/lib/formatar'
import { paginar } from '@/lib/paginar'
import { AbrirLinha } from '../_components/abrir-linha'

export const metadata: Metadata = { title: 'Contas a receber' }

const FAIXAS = [
  { rotulo: 'A vencer', de: -Infinity, ate: 0, cor: 'bg-brand-300' },
  { rotulo: '1 a 15 dias de atraso', de: 1, ate: 15, cor: 'bg-accent/50' },
  { rotulo: '16 a 30 dias', de: 16, ate: 30, cor: 'bg-accent' },
  { rotulo: '31 a 60 dias', de: 31, ate: 60, cor: 'bg-danger/70' },
  { rotulo: 'Mais de 60 dias', de: 61, ate: Infinity, cor: 'bg-danger' },
]

/** "Quem mais deve" mostra só os maiores; o título diz de quantos. */
const MAIORES_DEVEDORES = 6

export default async function PaginaReceber({ searchParams }: { searchParams: Promise<{ pagina?: string }> }) {
  const [{ pagina }, { hoje: dia, notas }] = await Promise.all([searchParams, listarNotas()])
  const abertas = notas
    .filter(({ nota }) => saldoAReceber(nota, dia) > 0)
    .map((item) => ({ ...item, atraso: diasDeAtraso(item.nota, dia), saldo: saldoAReceber(item.nota, dia) }))
    .sort((a, b) => b.atraso - a.atraso || a.nota.previsao.localeCompare(b.nota.previsao))
  const paginado = paginar(abertas, pagina)

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
      <PageHeader
        titulo="Contas a receber"
        resumo={`${brl(total)} em ${contar(abertas.length, 'nota aberta', 'notas abertas')}; ${brl(resumo.atrasado)} já passou da previsão. Notas com retenção aparecem pelo líquido.`}
      />

      <Resumo className="mb-8">
        <ItemResumo rotulo="A receber" valor={brl(total)} detalhe={contar(abertas.length, 'nota', 'notas')} />
        <ItemResumo
          rotulo="Atrasado"
          valor={brl(resumo.atrasado)}
          detalhe={contar(resumo.quantidadeAtrasadas, 'nota', 'notas')}
          tom={resumo.atrasado ? 'danger' : 'neutral'}
        />
        <ItemResumo rotulo="Entra em 30 dias" valor={brl(proximos30)} detalhe="pela previsão" tom="ok" />
        <ItemResumo rotulo="Prazo para receber" valor={contar(resumo.prazoMedianoDias, 'dia', 'dias')} detalhe="mediana, da emissão ao pagamento" />
      </Resumo>

      <div className="mb-8 grid gap-8 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <Secao titulo="Por tempo de atraso">
            <div className="flex h-3 overflow-hidden rounded-full bg-rail">
              {faixas.map((faixa) => (
                <div key={faixa.rotulo} title={`${faixa.rotulo}: ${brl(faixa.valor)}`} className={faixa.cor} style={{ width: `${total ? (faixa.valor / total) * 100 : 0}%` }} />
              ))}
            </div>
            <ul className="mt-4 space-y-2">
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
          </Secao>
        </div>
        <div className="lg:col-span-2">
          <Secao
            titulo="Quem mais deve"
            acao={porGrupo.length > MAIORES_DEVEDORES && <span className="text-sm text-muted">os {MAIORES_DEVEDORES} maiores de {porGrupo.length}</span>}
          >
            <Lista>
              {porGrupo.slice(0, MAIORES_DEVEDORES).map(([nome, valor]) => (
                <Linha key={nome}>
                  <span className="min-w-0 flex-1 truncate">{nome}</span>
                  <span className="font-medium tabular-nums">{brl(valor)}</span>
                </Linha>
              ))}
            </Lista>
          </Secao>
        </div>
      </div>

      <Secao titulo={`${contar(abertas.length, 'nota em aberto', 'notas em aberto')}, as mais atrasadas primeiro`}>
        <Card flush>
          <table className="tabela">
            <thead>
              <tr>
                <th>Cliente</th>
                <th className="hidden sm:table-cell">NF</th>
                <th className="hidden sm:table-cell">Previsão</th>
                <th className="num">Atraso</th>
                <th className="num">Saldo</th>
                <th className="hidden sm:table-cell">Situação</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {paginado.itens.map(({ nota, cliente, atraso, saldo }) => (
                <tr key={nota.id}>
                  <td className="sm:min-w-60">
                    {cliente.nome}
                    <p className="text-xs text-subtle">
                      {nota.descricao}
                      {/* No celular a coluna NF some; o número vem para cá. */}
                      <span className="sm:hidden"> · NF {nota.numero}</span>
                    </p>
                  </td>
                  <td className="hidden tabular-nums sm:table-cell">
                    <Link href={`/financeiro/notas/${nota.id}`} className="link">
                      {nota.numero}
                    </Link>
                  </td>
                  <td className="hidden whitespace-nowrap sm:table-cell">{formatarDataCurta(nota.previsao)}</td>
                  <td className={cn('num', atraso > 30 ? 'font-medium text-danger' : atraso > 0 && 'text-warn')}>{atraso ? contar(atraso, 'dia', 'dias') : '—'}</td>
                  <td className="num font-medium">{brl(saldo)}</td>
                  <td className="hidden sm:table-cell">
                    <SituacaoDaNota situacao={situacaoNota(nota, dia)} />
                  </td>
                  <AbrirLinha href={`/financeiro/notas/${nota.id}`} rotulo={`Abrir NF ${nota.numero}`} />
                </tr>
              ))}
            </tbody>
          </table>
          {abertas.length === 0 && <Vazio>Nenhuma nota em aberto.</Vazio>}
        </Card>
        <Paginacao {...paginado} href={(n) => `/financeiro/receber?pagina=${n}`} />
      </Secao>
    </>
  )
}

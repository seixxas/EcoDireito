import { Construction } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { PageHeader } from '@/components/ui/page-header'
import { ItemResumo, Resumo } from '@/components/ui/resumo'
import { Secao } from '@/components/ui/secao'
import { Situacao } from '@/components/ui/situacao'
import { exigirArea } from '@/data/sessao'
import { brl } from '@/lib/formatar'
import { reais } from '@/lib/dinheiro'

export const metadata: Metadata = { title: 'Comercial' }

type Proposta = { empresa: string; obra: string; valor: number; nota: string; alerta?: string; processo?: string }

/** Exemplo fixo para apresentar a ideia. Nada aqui vem do banco. */
const COLUNAS: { titulo: string; propostas: Proposta[] }[] = [
  {
    titulo: 'Em elaboração',
    propostas: [{ empresa: 'Construtora Vale Alto', obra: 'Residencial Jardim Sul', valor: 72_000, nota: 'Pedido em 28/10, visita ao terreno feita' }],
  },
  {
    titulo: 'Enviadas',
    propostas: [
      { empresa: 'Hospital Santa Clara', obra: 'Ampliação', valor: 84_000, nota: 'Enviada há 6 dias' },
      { empresa: 'Altavista Butantã', obra: 'Rua Alvarenga, 1.250', valor: 68_000, nota: 'Enviada há 12 dias', alerta: 'Sem resposta: ligar' },
    ],
  },
  {
    titulo: 'Em negociação',
    propostas: [
      { empresa: 'Horizonte Tatuapé', obra: 'Torre B', valor: 110_000, nota: 'Pediu 10% de desconto' },
      { empresa: 'Colégio Monteiro Lobato', obra: 'Nova quadra', valor: 22_000, nota: 'Reunião com a diretoria em 10/11' },
    ],
  },
  {
    titulo: 'Aprovadas',
    propostas: [{ empresa: 'Altavista', obra: 'Vila Mariana', valor: 58_000, nota: 'Aprovada em 28/09: virou processo', processo: '/processos/p08' }],
  },
]

const IDEIAS = [
  'Cada pedido de orçamento vira um cartão, que anda de coluna até ser aprovado ou perdido.',
  'Lembrete de retorno: proposta enviada sem resposta há mais de 7 dias aparece no Hoje.',
  'Ao aprovar, a proposta vira processo com a fase Proposta já concluída e a 1ª parcela liberada para faturar.',
  'Números do mês: valor em negociação, quantas propostas viram processo e em quanto tempo.',
]

/** Prévia da área comercial: só para apresentar a ideia, ainda sem dados reais. */
export default async function PaginaComercial() {
  await exigirArea('comercial')
  const emAberto = COLUNAS.slice(0, 3).flatMap((c) => c.propostas)

  return (
    <>
      <PageHeader titulo="Comercial" resumo="Propostas e orçamentos, do pedido até virar processo." />

      <div className="mb-6 flex items-start gap-3 rounded-lg border border-accent/40 bg-warn-soft px-4 py-3">
        <Construction className="mt-0.5 size-5 shrink-0 text-warn" />
        <p className="text-sm text-ink">
          <strong className="font-semibold">Em desenvolvimento.</strong> Esta tela mostra a ideia com propostas de exemplo. Ainda não grava nada e os números
          abaixo não são reais.
        </p>
      </div>

      <Resumo>
        <ItemResumo rotulo="Em aberto" valor={brl(reais(emAberto.reduce((soma, p) => soma + p.valor, 0)))} detalhe={`${emAberto.length} propostas, da elaboração à negociação`} />
        <ItemResumo rotulo="Viram processo" valor="62%" detalhe="nos últimos 6 meses" />
        <ItemResumo rotulo="Tempo até aprovar" valor="18 dias" detalhe="mediana" />
        <ItemResumo rotulo="Retornos atrasados" valor="1" detalhe="sem resposta há mais de 7 dias" tom="warn" />
      </Resumo>

      <Secao titulo="Funil de propostas">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {COLUNAS.map((coluna) => (
            <div key={coluna.titulo} className="rounded-lg border border-line bg-rail/60 p-2">
              <p className="flex items-baseline justify-between px-1.5 pb-2 pt-1 text-sm">
                <span className="font-medium text-ink">
                  {coluna.titulo} <span className="text-subtle">{coluna.propostas.length}</span>
                </span>
                <span className="tabular-nums text-muted">{brl(reais(coluna.propostas.reduce((soma, p) => soma + p.valor, 0)))}</span>
              </p>
              <ul className="space-y-2">
                {coluna.propostas.map((p) => (
                  <li key={p.empresa} className="rounded-md border border-line bg-surface p-3">
                    <p className="font-medium text-ink">{p.empresa}</p>
                    <p className="text-xs text-muted">{p.obra}</p>
                    <p className="mt-2 tabular-nums text-ink">{brl(reais(p.valor))}</p>
                    <p className="mt-1 text-xs text-muted">{p.nota}</p>
                    {p.alerta && <Situacao tom="warn" className="mt-1 text-xs">{p.alerta}</Situacao>}
                    {p.processo && (
                      <Link href={p.processo} className="link mt-1 inline-block text-xs">
                        Ver o processo
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </Secao>

      <Secao titulo="O que esta área vai fazer">
        <ul className="max-w-3xl list-disc space-y-1.5 pl-5 text-sm text-ink marker:text-subtle">
          {IDEIAS.map((ideia) => (
            <li key={ideia}>{ideia}</li>
          ))}
        </ul>
      </Secao>
    </>
  )
}

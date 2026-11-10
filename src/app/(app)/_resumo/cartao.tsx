import type { ReactNode } from 'react'
import { Icone, type NomeIcone } from '@/components/ui/icone'
import { LinkRapido } from '@/components/ui/link-rapido'
import { cn } from '@/lib/cn'

/**
 * Peças do Resumo (desenho 3a, 10/11). Regra da tela: pouco texto, um número grande por bloco e um link para o detalhe.
 * Quem quer saber mais clica e vai para a tela da área.
 */

/**
 * Cada área tem a sua cor (pedido de 10/11): financeiro vermelho, projetos amarelo, propostas verde e Diário Oficial azul.
 * A cor fica no ícone do título, na faixa do topo e nos gráficos; verde/vermelho de situação (em dia, atrasado) não mudam.
 */
export type TomDoCartao = 'verde' | 'vermelho' | 'amarelo' | 'azul'

export const CORES_DO_CARTAO: Record<TomDoCartao, { quadrado: string; faixa: string; icone: string }> = {
  verde: { quadrado: 'bg-brand-100 text-brand-700', faixa: 'bg-brand-500', icone: 'text-brand-700' },
  vermelho: { quadrado: 'bg-danger-soft text-danger', faixa: 'bg-danger', icone: 'text-danger' },
  amarelo: { quadrado: 'bg-warn-soft text-warn', faixa: 'bg-accent', icone: 'text-warn' },
  azul: { quadrado: 'bg-info-soft text-info', faixa: 'bg-info', icone: 'text-info' },
}

/** Ícone num quadradinho verde claro, ao lado do título. */
export function IconeDoTitulo({ nome, className }: { nome: NomeIcone; className?: string }) {
  return (
    <span className={cn('inline-flex size-8 shrink-0 items-center justify-center rounded-[9px] bg-brand-100 text-brand-700', className)}>
      <Icone nome={nome} cheio className="text-[1.1875rem]" />
    </span>
  )
}

/** "Abrir →": leva para a tela da área. */
export function LinkAbrir({ href, children = 'Abrir' }: { href: string; children?: ReactNode }) {
  return (
    <LinkRapido href={href} className="inline-flex min-h-8 items-center gap-1 rounded-md text-sm font-semibold text-brand-700 hover:text-brand-900">
      {children}
      <Icone nome="arrow_forward" className="text-lg" />
    </LinkRapido>
  )
}

/** Cartão branco com fio fino: ícone + título à esquerda, "Abrir" à direita. */
export function CartaoResumo({
  icone,
  titulo,
  href,
  acao,
  tom,
  className,
  children,
}: {
  icone: NomeIcone
  titulo: string
  href?: string
  acao?: string
  /** Sem tom, o cartão fica no verde da marca e sem faixa no topo (os de prazos). */
  tom?: TomDoCartao
  className?: string
  children: ReactNode
}) {
  return (
    <section className={cn('relative flex flex-col gap-3.5 overflow-hidden rounded-[14px] bg-surface px-[22px] py-5 ring-1 ring-line', className)}>
      {tom && <span aria-hidden className={cn('absolute inset-x-0 top-0 h-1', CORES_DO_CARTAO[tom].faixa)} />}
      <header className="flex items-center justify-between gap-3">
        <h2 className="flex items-center gap-2.5 text-lg font-semibold text-ink">
          <IconeDoTitulo nome={icone} className={tom && CORES_DO_CARTAO[tom].quadrado} />
          {titulo}
        </h2>
        {href && <LinkAbrir href={href}>{acao}</LinkAbrir>}
      </header>
      {children}
    </section>
  )
}

/** Rótulo pequeno com ícone e o número grande embaixo ("A receber / R$ 430.845,50"). */
export function Destaque({ icone, rotulo, valor, tom = 'verde', className }: { icone: NomeIcone; rotulo: string; valor: ReactNode; tom?: TomDoCartao; className?: string }) {
  return (
    <div className={cn('flex flex-col gap-0.5', className)}>
      <span className="flex items-center gap-1.5 text-xs text-muted">
        <Icone nome={icone} className={cn('text-[1.0625rem]', CORES_DO_CARTAO[tom].icone)} />
        {rotulo}
      </span>
      <span className="text-[1.75rem] font-semibold leading-tight tracking-[-0.02em] text-ink">{valor}</span>
    </div>
  )
}

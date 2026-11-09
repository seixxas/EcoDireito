import type { ComponentProps, ReactNode } from 'react'
import { cn } from '@/lib/cn'
import type { EstadoFormulario } from '@/lib/formulario'

const VARIANTES = {
  primario: 'brilho border-brand-700 bg-brand-700 text-on-brand hover:border-brand-900 hover:bg-brand-900',
  secundario: 'border-campo bg-surface text-brand-700 hover:border-brand-700 hover:bg-brand-50',
  perigo: 'border-danger bg-danger text-on-danger hover:border-danger-forte hover:bg-danger-forte',
  /** Ação do Diário Oficial, em cima de bloco azul. */
  diario: 'border-info bg-info text-on-info hover:opacity-90',
  'diario-claro': 'border-info bg-surface text-info hover:bg-info-soft',
} as const

/** `pequeno` é para dentro de tabela e de lista. No toque, os dois crescem um pouco, para acertar com o dedo. */
const TAMANHOS = {
  normal: 'min-h-9 px-3 text-sm pointer-coarse:min-h-11',
  pequeno: 'min-h-7 px-2 text-xs pointer-coarse:min-h-9',
} as const

export type VarianteBotao = keyof typeof VARIANTES
export type TamanhoBotao = keyof typeof TAMANHOS

/** Classes de botão, também para `<Link>`. */
export function classeBotao(variante: VarianteBotao = 'primario', className?: string, tamanho: TamanhoBotao = 'normal') {
  return cn(
    'inline-flex cursor-pointer items-center justify-center gap-1.5 whitespace-nowrap rounded-md border font-medium no-underline transition-colors disabled:cursor-not-allowed disabled:opacity-60',
    TAMANHOS[tamanho],
    VARIANTES[variante],
    className,
  )
}

export function Botao({ variante, tamanho, className, ...props }: ComponentProps<'button'> & { variante?: VarianteBotao; tamanho?: TamanhoBotao }) {
  return <button className={classeBotao(variante, className, tamanho)} {...props} />
}

const CAMPO = 'w-full rounded-md border border-campo bg-surface px-3 text-sm text-ink outline-none placeholder:text-subtle focus:border-brand-700 focus:ring-2 focus:ring-brand-100'

export function Entrada({ className, ...props }: ComponentProps<'input'>) {
  return <input className={cn(CAMPO, 'min-h-9 pointer-coarse:min-h-11', className)} {...props} />
}

export function Selecao({ className, ...props }: ComponentProps<'select'>) {
  return <select className={cn(CAMPO, 'min-h-9 pointer-coarse:min-h-11', className)} {...props} />
}

export function AreaTexto({ className, ...props }: ComponentProps<'textarea'>) {
  return <textarea className={cn(CAMPO, 'min-h-20 py-1.5', className)} {...props} />
}

/** Rótulo sempre visível + dica + controle + erro do campo (vindo de `estado.erros[nome]`). */
export function Campo({ rotulo, erro, dica, className, children }: { rotulo: string; erro?: string; dica?: string; className?: string; children: ReactNode }) {
  return (
    <label className={cn('block', erro && '[&_input]:border-danger [&_select]:border-danger [&_textarea]:border-danger', className)}>
      <span className="block text-sm font-medium text-ink">{rotulo}</span>
      <span className="mt-1 block">{children}</span>
      {erro ? <span className="mt-1 block text-xs font-medium text-danger-forte">{erro}</span> : dica && <span className="mt-0.5 block text-xs text-subtle">{dica}</span>}
    </label>
  )
}

/** Mensagem geral do formulário: o erro em vermelho, o que foi salvo em verde. Fica na tela até a pessoa sair ou agir. */
export function MensagemFormulario({ estado }: { estado?: EstadoFormulario }) {
  if (estado?.erro) {
    return (
      <p role="alert" className="rounded-md bg-danger-soft px-3 py-2 text-sm font-medium text-danger-forte">
        {estado.erro}
      </p>
    )
  }
  if (estado?.ok) {
    return (
      <p role="status" className="rounded-md bg-brand-100 px-3 py-2 text-sm font-medium text-brand-700">
        {estado.ok}
      </p>
    )
  }
  return null
}

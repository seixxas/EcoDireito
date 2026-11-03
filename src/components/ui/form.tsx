import type { ComponentProps, ReactNode } from 'react'
import { cn } from '@/lib/cn'
import type { EstadoFormulario } from '@/lib/formulario'

const VARIANTES = {
  primario: 'bg-brand-700 text-white hover:bg-brand-900',
  secundario: 'border border-line bg-surface text-ink hover:bg-canvas',
  perigo: 'border border-danger/30 bg-surface text-danger hover:bg-danger-soft',
} as const

export type VarianteBotao = keyof typeof VARIANTES

/** Classes de botão, também para `<Link>`. */
export function classeBotao(variante: VarianteBotao = 'primario', className?: string) {
  return cn(
    'inline-flex h-9 items-center justify-center gap-1.5 whitespace-nowrap rounded-md px-3 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-60',
    VARIANTES[variante],
    className,
  )
}

export function Botao({ variante, className, ...props }: ComponentProps<'button'> & { variante?: VarianteBotao }) {
  return <button className={classeBotao(variante, className)} {...props} />
}

const CAMPO = 'w-full rounded-md border border-line bg-surface px-3 py-1.5 text-sm text-ink outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100'

export function Entrada({ className, ...props }: ComponentProps<'input'>) {
  return <input className={cn(CAMPO, className)} {...props} />
}

export function Selecao({ className, ...props }: ComponentProps<'select'>) {
  return <select className={cn(CAMPO, className)} {...props} />
}

export function AreaTexto({ className, ...props }: ComponentProps<'textarea'>) {
  return <textarea className={cn(CAMPO, 'min-h-24', className)} {...props} />
}

/** Rótulo + controle + erro do campo (vindo de `estado.erros[nome]`). */
export function Campo({ rotulo, erro, dica, className, children }: { rotulo: string; erro?: string; dica?: string; className?: string; children: ReactNode }) {
  return (
    <label className={cn('block space-y-1', className)}>
      <span className="text-sm font-medium text-ink">{rotulo}</span>
      {children}
      {erro ? <span className="block text-xs text-danger">{erro}</span> : dica && <span className="block text-xs text-subtle">{dica}</span>}
    </label>
  )
}

/** Mensagem geral do formulário (erro ou sucesso). */
export function MensagemFormulario({ estado }: { estado?: EstadoFormulario }) {
  if (estado?.erro) return <p className="rounded-md bg-danger-soft px-3 py-2 text-sm text-danger">{estado.erro}</p>
  if (estado?.ok) return <p className="rounded-md bg-ok-soft px-3 py-2 text-sm text-ok">{estado.ok}</p>
  return null
}

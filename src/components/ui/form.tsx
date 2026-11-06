import type { ComponentProps, ReactNode } from 'react'
import { cn } from '@/lib/cn'
import type { EstadoFormulario } from '@/lib/formulario'

const VARIANTES = {
  primario: 'border-brand-700 bg-brand-700 text-on-brand hover:border-brand-900 hover:bg-brand-900',
  secundario: 'border-brand-700 bg-surface text-brand-700 hover:bg-brand-50',
  perigo: 'border-danger bg-danger text-on-danger hover:border-danger-forte hover:bg-danger-forte',
  /** Ação do Diário Oficial, em cima de bloco azul. */
  diario: 'border-info bg-info text-on-info hover:opacity-90',
  'diario-claro': 'border-info bg-surface text-info hover:bg-info-soft',
} as const

export type VarianteBotao = keyof typeof VARIANTES

/** Classes de botão, também para `<Link>`. Altura mínima de 52 px: fácil de acertar com o mouse e no toque. */
export function classeBotao(variante: VarianteBotao = 'primario', className?: string) {
  return cn(
    'inline-flex min-h-13 cursor-pointer items-center justify-center gap-2 whitespace-nowrap rounded-md border-2 px-5 text-base font-medium no-underline transition-colors disabled:cursor-not-allowed disabled:opacity-60',
    VARIANTES[variante],
    className,
  )
}

export function Botao({ variante, className, ...props }: ComponentProps<'button'> & { variante?: VarianteBotao }) {
  return <button className={classeBotao(variante, className)} {...props} />
}

const CAMPO = 'w-full rounded-md border-2 border-campo bg-surface px-4 text-base text-ink outline-none placeholder:text-subtle focus:border-brand-700 focus:ring-3 focus:ring-brand-300'

export function Entrada({ className, ...props }: ComponentProps<'input'>) {
  return <input className={cn(CAMPO, 'min-h-14', className)} {...props} />
}

export function Selecao({ className, ...props }: ComponentProps<'select'>) {
  return <select className={cn(CAMPO, 'min-h-14', className)} {...props} />
}

export function AreaTexto({ className, ...props }: ComponentProps<'textarea'>) {
  return <textarea className={cn(CAMPO, 'min-h-32 py-3', className)} {...props} />
}

/** Erro em frase simples, junto do campo. */
function ErroDoCampo({ children }: { children: ReactNode }) {
  return (
    <span className="mt-2.5 flex items-start gap-2.5 rounded-md bg-danger-soft px-4 py-3 text-sm font-medium text-danger-forte">
      <b className="flex-none rounded-sm bg-danger px-2 text-2xs font-semibold leading-[1.6] text-on-danger">Confira</b>
      {children}
    </span>
  )
}

/** Rótulo sempre visível + dica + controle + erro do campo (vindo de `estado.erros[nome]`). */
export function Campo({ rotulo, erro, dica, className, children }: { rotulo: string; erro?: string; dica?: string; className?: string; children: ReactNode }) {
  return (
    <label className={cn('block', erro && '[&_input]:border-3 [&_input]:border-danger [&_select]:border-3 [&_select]:border-danger [&_textarea]:border-3 [&_textarea]:border-danger', className)}>
      <span className="block text-base font-semibold text-ink">{rotulo}</span>
      {dica && <span className="mt-0.5 block text-xs text-muted">{dica}</span>}
      <span className="mt-2 block">{children}</span>
      {erro && <ErroDoCampo>{erro}</ErroDoCampo>}
    </label>
  )
}

/** Mensagem geral do formulário: o erro em vermelho, o que foi salvo em verde. Fica na tela até a pessoa sair ou agir. */
export function MensagemFormulario({ estado }: { estado?: EstadoFormulario }) {
  if (estado?.erro) {
    return (
      <p role="alert" className="flex items-start gap-2.5 rounded-md bg-danger-soft px-4 py-3 text-sm font-medium text-danger-forte">
        <b className="flex-none rounded-sm bg-danger px-2 text-2xs font-semibold leading-[1.6] text-on-danger">Confira</b>
        {estado.erro}
      </p>
    )
  }
  if (estado?.ok) {
    return (
      <p role="status" className="rounded-lg border-2 border-brand-700 bg-brand-100 px-5 py-4 text-base font-medium text-brand-700">
        {estado.ok}
      </p>
    )
  }
  return null
}

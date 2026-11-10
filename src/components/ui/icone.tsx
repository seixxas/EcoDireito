import { cn } from '@/lib/cn'

/**
 * Ícones do Material Symbols Rounded (desenho 3a). A fonte vem do Google só com os nomes desta lista (`icon_names`),
 * então ícone novo precisa entrar aqui, senão aparece o nome escrito. Mantenha em ordem alfabética.
 */
export const ICONES = [
  'account_balance_wallet',
  'add',
  'alarm',
  'arrow_forward',
  'assignment_late',
  'autorenew',
  'bar_chart',
  'calendar_month',
  'call',
  'cancel',
  'check_circle',
  'close',
  'construction',
  'dark_mode',
  'date_range',
  'description',
  'eco',
  'edit_note',
  'error',
  'event_available',
  'folder',
  'folder_open',
  'forest',
  'group',
  'handshake',
  'help',
  'home',
  'hourglass_top',
  'light_mode',
  'logout',
  'menu',
  'newspaper',
  'notifications',
  'payments',
  'person',
  'push_pin',
  'reply',
  'request_quote',
  'search',
  'send',
  'trending_up',
  'warning',
] as const

export type NomeIcone = (typeof ICONES)[number]

/** Folha de estilo da fonte de ícones, recortada para a lista acima. Vai no <head> do layout raiz. */
export const URL_DOS_ICONES = `https://fonts.googleapis.com/css2?family=Material+Symbols+Rounded:opsz,wght,FILL,GRAD@20..24,400..600,0..1,0&icon_names=${[...ICONES].sort().join(',')}&display=block`

/** Ícone decorativo (o texto ao lado diz o que é). `cheio` usa a versão preenchida. O tamanho vem do `font-size` (padrão 20 px). */
export function Icone({ nome, cheio, className }: { nome: NomeIcone; cheio?: boolean; className?: string }) {
  return (
    <span aria-hidden className={cn('icone', cheio && 'icone-cheio', className)}>
      {nome}
    </span>
  )
}

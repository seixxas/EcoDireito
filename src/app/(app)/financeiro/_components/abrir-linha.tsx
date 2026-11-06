import { classeBotao } from '@/components/ui/form'
import { LinkRapido } from '@/components/ui/link-rapido'
import { cn } from '@/lib/cn'

type Props = { href: string; rotulo: string; scroll?: boolean }

/** Botão "Abrir" da linha. `rotulo` diz o que abre, para o leitor de tela. Com `scroll={false}`, a lista fica onde está (painel). */
export function BotaoAbrir({ href, rotulo, scroll }: Props) {
  return (
    <LinkRapido href={href} scroll={scroll} aria-label={rotulo} className={classeBotao('secundario', undefined, 'pequeno')}>
      Abrir
    </LinkRapido>
  )
}

/** Coluna no fim da linha da tabela: mostra que a linha abre o detalhe. */
export function AbrirLinha({ className, ...props }: Props & { className?: string }) {
  return (
    <td className={cn('text-right', className)}>
      <BotaoAbrir {...props} />
    </td>
  )
}

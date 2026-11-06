import { classeBotao } from '@/components/ui/form'
import { LinkRapido } from '@/components/ui/link-rapido'
import { formatarMes } from '@/lib/formatar'

/** Valor de `?mes=` para o histórico inteiro (útil com busca: "todas as notas do cliente X"). */
export const TODOS_OS_MESES = 'todos'

const MES_ATUAL = 'px-1.5 text-xl font-semibold text-ink'

/**
 * ← Mês anterior · out/26 · Próximo mês →: anda pelos meses do histórico. O mês vive na URL (`?mes=`), quem usa monta o link.
 * Com `todos`, oferece também o histórico inteiro (`href(TODOS_OS_MESES)`).
 */
export function NavegacaoMes({ mes, meses, href, todos }: { mes: string; meses: string[]; href: (mes: string) => string; todos?: boolean }) {
  if (mes === TODOS_OS_MESES) {
    return (
      <nav aria-label="Mês" className="flex flex-wrap items-center gap-2">
        <span className={MES_ATUAL}>Todos os meses</span>
        <LinkRapido href={href(meses.at(-1)!)} scroll={false} className={classeBotao('secundario')}>
          Ver por mês
        </LinkRapido>
      </nav>
    )
  }

  const i = meses.indexOf(mes)
  const passo = (alvo: string | undefined, rotulo: string) =>
    alvo ? (
      <LinkRapido href={href(alvo)} scroll={false} className={classeBotao('secundario')}>
        {rotulo}
      </LinkRapido>
    ) : (
      <span className="inline-flex min-h-9 items-center rounded-md border border-line px-3 text-base font-medium text-subtle">{rotulo}</span>
    )

  return (
    <nav aria-label="Mês" className="flex flex-wrap items-center gap-2">
      {passo(meses[i - 1], '← Mês anterior')}
      <span className={MES_ATUAL}>{formatarMes(mes)}</span>
      {passo(meses[i + 1], 'Próximo mês →')}
      {todos && (
        <LinkRapido href={href(TODOS_OS_MESES)} scroll={false} className={classeBotao('secundario')}>
          Todos os meses
        </LinkRapido>
      )}
    </nav>
  )
}

import { COR_DO_TEXTO, type Tom } from '@/components/ui/badge'
import { Situacao } from '@/components/ui/situacao'
import { CUSTO_HORA_EQUIPE, type SituacaoMargem } from '@/domain/financeiro/lucratividade'
import { cn } from '@/lib/cn'
import { brl, formatarPercentual } from '@/lib/formatar'

export const MARGENS: Record<SituacaoMargem, { rotulo: string; tom: Tom }> = {
  boa: { rotulo: 'Boa', tom: 'ok' },
  atencao: { rotulo: 'Atenção', tom: 'warn' },
  ruim: { rotulo: 'Ruim', tom: 'danger' },
}

/** O selo e a frase que dizem o que é simulado (vão na lista e no detalhe do projeto). */
export function AvisoDeSimulacao({ className }: { className?: string }) {
  return (
    <p className={cn('rounded-md bg-info-soft px-3 py-1.5 text-xs', className)}>
      <strong className="font-semibold text-info">Simulação.</strong> Contrato, faturado, recebido e custos diretos vêm das notas e dos lançamentos ligados ao projeto (dados
      fictícios). O custo da equipe é estimado: horas simuladas × {brl(CUSTO_HORA_EQUIPE)}/h, até a equipe registrar as horas.
    </p>
  )
}

export function Margem({ margemPct, situacao }: { margemPct?: number; situacao?: SituacaoMargem }) {
  if (margemPct === undefined || !situacao) return <span className="text-sm font-normal text-subtle">sem faturamento</span>
  const { rotulo, tom } = MARGENS[situacao]
  return (
    <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
      <Situacao tom={tom}>{rotulo}</Situacao>
      <span className={cn('text-sm font-semibold', COR_DO_TEXTO[tom])}>{formatarPercentual(margemPct)}</span>
    </span>
  )
}

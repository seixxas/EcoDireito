import { Badge, type Tom } from '@/components/ui/badge'
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
    <p className={cn('flex flex-wrap items-baseline gap-x-2 gap-y-1 text-sm text-muted', className)}>
      <Badge tom="warn">Simulação</Badge>
      <span>
        Contrato, faturado, recebido e custos diretos vêm das notas e dos lançamentos ligados ao processo (dados fictícios). O custo da equipe é estimado: horas
        simuladas × {brl(CUSTO_HORA_EQUIPE)}/h, até a equipe registrar as horas.
      </span>
    </p>
  )
}

export function Margem({ margemPct, situacao }: { margemPct?: number; situacao?: SituacaoMargem }) {
  if (margemPct === undefined || !situacao) return <span className="text-sm text-subtle">sem faturamento</span>
  return <Situacao tom={MARGENS[situacao].tom}>{formatarPercentual(margemPct)}</Situacao>
}

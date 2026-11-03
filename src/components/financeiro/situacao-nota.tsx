import { Badge, type Tom } from '@/components/ui/badge'
import type { SituacaoNota } from '@/domain/financeiro/notas'

export const SITUACOES_NOTA: Record<SituacaoNota, { rotulo: string; tom: Tom }> = {
  a_receber: { rotulo: 'A receber', tom: 'info' },
  atrasada: { rotulo: 'Atrasada', tom: 'danger' },
  parcial: { rotulo: 'Recebida em parte', tom: 'warn' },
  recebida: { rotulo: 'Recebida', tom: 'ok' },
  cancelada: { rotulo: 'Cancelada', tom: 'neutral' },
}

export function SituacaoNotaBadge({ situacao }: { situacao: SituacaoNota }) {
  const { rotulo, tom } = SITUACOES_NOTA[situacao]
  return <Badge tom={tom}>{rotulo}</Badge>
}

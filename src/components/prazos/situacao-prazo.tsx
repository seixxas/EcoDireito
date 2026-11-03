import { Badge, type Tom } from '@/components/ui/badge'
import { situacaoPrazo, type Prazo } from '@/domain/prazos'
import type { DataISO } from '@/lib/datas'

const dias = (n: number) => `${n} ${n === 1 ? 'dia' : 'dias'}`

/** Prazo do órgão (expectativa) atrasado não é culpa da Eco Direito: tom de atenção, não de erro. */
export function descreverSituacao(prazo: Prazo, hoje: DataISO): { rotulo: string; tom: Tom } {
  const { situacao, dias: faltam } = situacaoPrazo(prazo, hoje)
  const doOrgao = prazo.regra.tipo === 'expectativa'

  if (situacao === 'cumprido') return { rotulo: 'Cumprido', tom: 'ok' }
  if (situacao === 'vencido') {
    return doOrgao ? { rotulo: `SVMA atrasada ${dias(-faltam)}`, tom: 'warn' } : { rotulo: `Venceu há ${dias(-faltam)}`, tom: 'danger' }
  }
  if (situacao === 'hoje') return doOrgao ? { rotulo: 'Previsto para hoje', tom: 'info' } : { rotulo: 'Vence hoje', tom: 'danger' }
  const quando = faltam === 1 ? 'amanhã' : `em ${dias(faltam)}`
  if (doOrgao) return { rotulo: `Previsto ${quando}`, tom: 'info' }
  return { rotulo: `Vence ${quando}`, tom: situacao === 'proximo' ? 'warn' : 'ok' }
}

export function SituacaoPrazo({ prazo, hoje }: { prazo: Prazo; hoje: DataISO }) {
  const { rotulo, tom } = descreverSituacao(prazo, hoje)
  return <Badge tom={tom}>{rotulo}</Badge>
}

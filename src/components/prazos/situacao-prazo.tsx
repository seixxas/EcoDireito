import type { Tom } from '@/components/ui/badge'
import { Situacao } from '@/components/ui/situacao'
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
  if (situacao === 'hoje') return doOrgao ? { rotulo: 'Previsto para hoje', tom: 'info' } : { rotulo: 'Vence hoje', tom: 'warn' }
  const quando = faltam === 1 ? 'amanhã' : `em ${dias(faltam)}`
  return doOrgao ? { rotulo: `Previsto ${quando}`, tom: 'info' } : { rotulo: `Vence ${quando}`, tom: 'brand' }
}

export function SituacaoPrazo({ prazo, hoje }: { prazo: Prazo; hoje: DataISO }) {
  const { rotulo, tom } = descreverSituacao(prazo, hoje)
  return <Situacao tom={tom}>{rotulo}</Situacao>
}

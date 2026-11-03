import Link from 'next/link'
import { Expansivel } from '@/components/ui/expansivel'
import { Linha } from '@/components/ui/lista'
import { TIPOS_PRAZO, type Prazo } from '@/domain/prazos'
import type { Cliente, Processo } from '@/domain/processos'
import type { DataISO } from '@/lib/datas'
import { formatarData, formatarDataNaLista } from '@/lib/formatar'
import { SituacaoPrazo } from './situacao-prazo'

/** Um prazo numa linha: quando, o que fazer, de qual processo e a situação. O cálculo fica recolhido. */
export function LinhaPrazo({ prazo, hoje, processo, cliente }: { prazo: Prazo; hoje: DataISO; processo?: Processo; cliente?: Cliente }) {
  const data = prazo.cumpridoEm ?? prazo.vencimento
  return (
    // No celular: data e situação na primeira linha, o prazo embaixo em largura total.
    <Linha className="flex-wrap items-start gap-y-1 sm:flex-nowrap">
      <span className="w-24 shrink-0 tabular-nums text-muted">{formatarDataNaLista(data, hoje)}</span>
      <div className="order-last min-w-0 basis-full sm:order-none sm:basis-auto sm:flex-1">
        <p className="font-medium text-ink">{prazo.regra.titulo}</p>
        <div className="flex flex-wrap items-baseline gap-x-3 text-xs text-muted">
          {processo && (
            <Link href={`/processos/${processo.id}`} className="text-brand-700 hover:underline">
              {processo.empreendimento}
            </Link>
          )}
          {cliente && <span>{cliente.nome}</span>}
          {processo?.responsavel && <span>{processo.responsavel}</span>}
          <Expansivel resumo={<span className="text-xs">cálculo</span>} className="open:basis-full">
            <p className="text-xs text-subtle">
              {prazo.cumpridoEm && `Venceria em ${formatarData(prazo.vencimento)}. `}
              {prazo.explicacao}. {TIPOS_PRAZO[prazo.regra.tipo]} · {prazo.regra.baseLegal}.
            </p>
          </Expansivel>
        </div>
      </div>
      <span className="ml-auto sm:ml-0">
        <SituacaoPrazo prazo={prazo} hoje={hoje} />
      </span>
    </Linha>
  )
}

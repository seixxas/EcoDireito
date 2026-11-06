import { classeBotao } from '@/components/ui/form'
import { LinkRapido } from '@/components/ui/link-rapido'
import { TIPOS_PRAZO, type Prazo } from '@/domain/prazos'
import { EVENTOS, type Cliente, type Processo } from '@/domain/processos'
import type { DataISO } from '@/lib/datas'
import { formatarData, formatarDataCurta, formatarDataLonga } from '@/lib/formatar'
import { SituacaoPrazo, descreverSituacao } from './situacao-prazo'

/** Dia e mês grandes; embaixo, o dia da semana e o que precisa ficar claro: que é hoje, ou o ano, se não for este. */
function Quando({ data, hoje }: { data: DataISO; hoje: DataISO }) {
  const ano = data.slice(0, 4)
  const lembrete = data === hoje ? 'hoje' : ano !== hoje.slice(0, 4) && ano
  return (
    <div className="w-20 shrink-0">
      <p className="text-sm font-semibold leading-tight text-ink">{formatarDataCurta(data)}</p>
      <p className="text-2xs text-muted">
        {formatarDataLonga(data).split(',')[0]}
        {lembrete && ` · ${lembrete}`}
      </p>
    </div>
  )
}

/**
 * Um prazo: quando, a situação, o que fazer, de qual projeto e os botões, que descem para baixo do texto quando não cabem.
 * O botão do cálculo fica junto dos outros, mas o texto abre embaixo do prazo, onde há largura. Vai dentro de `Lista` ou de um `<ul>`.
 */
export function LinhaPrazo({ prazo, hoje, processo, cliente }: { prazo: Prazo; hoje: DataISO; processo?: Processo; cliente?: Cliente }) {
  const vencido = descreverSituacao(prazo, hoje).tom === 'danger'
  return (
    <li className="group/prazo mb-px flex flex-wrap items-center gap-x-3 gap-y-1 bg-surface px-3 py-2 first:rounded-t-md last:mb-0 last:rounded-b-md">
      <Quando data={prazo.cumpridoEm ?? prazo.vencimento} hoje={hoje} />
      <div className="min-w-0 flex-[1_1_18rem]">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
          <SituacaoPrazo prazo={prazo} hoje={hoje} />
          <p className="text-sm font-medium text-ink">{prazo.regra.titulo}</p>
        </div>
        {(processo || cliente) && (
          <p className="text-xs text-muted">
            {processo && (
              <LinkRapido href={`/projetos/${processo.id}`} className="link">
                {processo.empreendimento}
              </LinkRapido>
            )}
            {cliente && ` · ${cliente.nome}`}
            {processo?.responsavel && ` · ${processo.responsavel}`}
          </p>
        )}
        <p className="mt-1 hidden rounded-md bg-rail px-2 py-1 text-xs text-muted group-has-[details[open]]/prazo:block">
          {prazo.cumpridoEm && `Venceria em ${formatarData(prazo.vencimento)}. `}
          {prazo.explicacao}. {TIPOS_PRAZO[prazo.regra.tipo]} · {prazo.regra.baseLegal}.
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-1.5">
        <details className="group/calculo">
          <summary className={classeBotao('secundario', 'list-none [&::-webkit-details-marker]:hidden', 'pequeno')}>
            <span className="group-open/calculo:hidden">Ver cálculo</span>
            <span className="hidden group-open/calculo:inline">Esconder cálculo</span>
          </summary>
        </details>
        {processo && (
          <LinkRapido href={`/projetos/${processo.id}?aba=etapas&fase=${EVENTOS[prazo.regra.cumpridoPor].fase}`} className={classeBotao(vencido ? 'perigo' : 'secundario', undefined, 'pequeno')}>
            Abrir o prazo
          </LinkRapido>
        )}
      </div>
    </li>
  )
}

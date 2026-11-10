import { Icone } from '@/components/ui/icone'
import { LinkRapido } from '@/components/ui/link-rapido'
import { listarPrazos } from '@/data/processos'
import { estaAberto } from '@/domain/prazos'
import { EVENTOS } from '@/domain/processos'
import { diasEntre, type DataISO } from '@/lib/datas'
import { contar } from '@/lib/formatar'

/** Só as obrigações da Eco Direito; o que depende da SVMA fica na tela de prazos. */
async function listarVencidos(dia: DataISO) {
  const prazos = await listarPrazos()
  return prazos.filter((p) => p.regra.tipo !== 'expectativa' && estaAberto(p, dia) && p.vencimento < dia)
}

export async function contarPrazosVencidos(dia: DataISO): Promise<number> {
  return (await listarVencidos(dia)).length
}

/** Bloco vermelho do Resumo: quantos prazos venceram e um botão para resolver cada um. */
export async function PrazosVencidos({ dia }: { dia: DataISO }) {
  const vencidos = await listarVencidos(dia)

  if (vencidos.length === 0) {
    return (
      <section className="flex items-center gap-2 rounded-[14px] bg-ok-soft px-[22px] py-5 ring-1 ring-line">
        <Icone nome="check_circle" cheio className="text-[1.375rem] text-ok" />
        <h2 className="text-[0.9375rem] font-semibold text-brand-700">Nenhum prazo vencido</h2>
      </section>
    )
  }

  return (
    <section className="flex flex-col gap-3.5 rounded-[14px] bg-danger-soft px-[22px] py-5 ring-1 ring-danger-fio">
      <h2 className="flex items-center gap-2 text-[0.9375rem] font-semibold text-danger-forte">
        <Icone nome="error" cheio className="text-[1.375rem] text-danger" />
        Prazos vencidos
      </h2>
      <p className="flex items-baseline gap-3">
        <span className="text-[3.75rem] font-bold leading-none tracking-[-0.03em] text-danger">{vencidos.length}</span>
        <span className="text-[0.9375rem] text-danger-forte">{vencidos.length === 1 ? 'precisa de resposta hoje' : 'precisam de resposta hoje'}</span>
      </p>
      <ul className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto">
        {vencidos.map((prazo) => (
          <li key={prazo.id} className="flex flex-wrap items-center gap-3 rounded-[10px] bg-surface px-3.5 py-3">
            <span className="inline-flex size-8 shrink-0 items-center justify-center rounded-[9px] bg-danger-soft text-danger">
              <Icone nome="assignment_late" cheio className="text-[1.1875rem]" />
            </span>
            <div className="flex min-w-0 flex-1 basis-40 flex-col gap-0.5">
              <span className="text-[0.90625rem] font-semibold text-ink">{prazo.regra.titulo}</span>
              <span className="flex flex-wrap items-center gap-x-1 text-[0.8125rem] text-muted">
                <span className="inline-flex min-w-0 items-center gap-1">
                  <Icone nome="folder" className="text-[0.9375rem] leading-none" />
                  {prazo.processo.empreendimento}
                </span>
                {prazo.processo.responsavel && (
                  <>
                    <span aria-hidden>·</span>
                    <span className="inline-flex items-center gap-1">
                      <Icone nome="person" className="text-[0.9375rem] leading-none" />
                      {prazo.processo.responsavel}
                    </span>
                  </>
                )}
              </span>
            </div>
            <span className="ml-auto flex items-center gap-3">
              <span className="whitespace-nowrap rounded-full bg-danger px-[9px] py-[3px] text-[0.78125rem] font-semibold text-on-danger">
                Há {contar(diasEntre(prazo.vencimento, dia), 'dia', 'dias')}
              </span>
              <LinkRapido
                href={`/projetos/${prazo.processo.id}?aba=etapas&fase=${EVENTOS[prazo.regra.cumpridoPor].fase}`}
                className="inline-flex h-8 items-center gap-1 whitespace-nowrap rounded-lg bg-brand-700 px-3 text-[0.84375rem] font-semibold text-on-brand hover:bg-brand-900"
              >
                Abrir projeto
                <Icone nome="arrow_forward" className="text-base" />
              </LinkRapido>
            </span>
          </li>
        ))}
      </ul>
    </section>
  )
}

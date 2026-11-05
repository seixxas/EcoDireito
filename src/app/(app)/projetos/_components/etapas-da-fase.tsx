import { CalendarClock, CheckCircle2, Circle, MinusCircle } from 'lucide-react'
import { SituacaoPrazo } from '@/components/prazos/situacao-prazo'
import type { Tom } from '@/components/ui/badge'
import { Expansivel } from '@/components/ui/expansivel'
import { Lista } from '@/components/ui/lista'
import { Situacao } from '@/components/ui/situacao'
import { estaAberto, REGRAS_SVMA, type Prazo } from '@/domain/prazos'
import { conclusaoDaFase, EVENTOS, etapasDaFase, FASES, situacaoDaFase, TIPOS_EVENTO, type Etapa, type Evento, type NumeroFase, type Processo, type SituacaoFase } from '@/domain/processos'
import type { DataISO } from '@/lib/datas'
import { formatarData } from '@/lib/formatar'
import { FormularioEtapa } from './formulario-etapa'

type EstadoEtapa = 'feita' | 'planejada' | 'pendente' | 'nao_houve' | 'sem_registro'

const ESTADO: Record<EstadoEtapa, { rotulo: string; tom: Tom; Icone: typeof Circle; cor: string }> = {
  feita: { rotulo: 'Feita', tom: 'ok', Icone: CheckCircle2, cor: 'text-ok' },
  planejada: { rotulo: 'Data marcada', tom: 'warn', Icone: CalendarClock, cor: 'text-warn' },
  pendente: { rotulo: 'Falta', tom: 'neutral', Icone: Circle, cor: 'text-subtle' },
  nao_houve: { rotulo: 'Não houve', tom: 'neutral', Icone: MinusCircle, cor: 'text-subtle' },
  sem_registro: { rotulo: 'Sem registro', tom: 'neutral', Icone: MinusCircle, cor: 'text-subtle' },
}

const SITUACAO_FASE: Record<SituacaoFase, Tom> = { concluida: 'ok', atual: 'warn', futura: 'neutral' }

/** Etapa opcional (Comunique-se) que não aconteceu numa fase já encerrada "não houve"; obrigatória fica "sem registro". */
function estadoDaEtapa(etapa: Etapa, fase: SituacaoFase): EstadoEtapa {
  if (etapa.feitos.length) return 'feita'
  if (etapa.planejados.length) return 'planejada'
  if (fase !== 'concluida') return 'pendente'
  return etapa.info.quando ? 'nao_houve' : 'sem_registro'
}

function Ocorrencia({ evento, planejada }: { evento: Evento; planejada?: boolean }) {
  return (
    <p className="mt-1 text-sm text-ink">
      <span className="tabular-nums">{planejada ? `Marcada para ${formatarData(evento.data)}` : formatarData(evento.data)}</span>
      <span className="text-subtle"> · {evento.origem === 'diario' ? 'Diário Oficial' : 'Equipe'}</span>
      {evento.observacao && <span className="block whitespace-pre-line text-muted">{evento.observacao}</span>}
    </p>
  )
}

type Props = { processo: Processo; fase: NumeroFase; dia: DataISO; prazos: Prazo[]; editar: boolean }

/** O checklist de uma fase: o que já aconteceu, quem faz cada etapa, de onde ela vem e o que falta. */
export function EtapasDaFase({ processo, fase, dia, prazos, editar }: Props) {
  const { nome, descricao } = FASES[fase - 1]
  const situacao = situacaoDaFase(processo, fase, dia)
  const concluidaEm = conclusaoDaFase(processo, fase, dia)
  const final = TIPOS_EVENTO.find((tipo) => EVENTOS[tipo].fase === fase && EVENTOS[tipo].fecha)
  const rotuloFase =
    situacao === 'concluida' ? (concluidaEm ? `Concluída em ${formatarData(concluidaEm)}` : 'Concluída') : situacao === 'atual' ? 'Fase atual' : 'Ainda não começou'

  return (
    <section aria-label={`Etapas da fase ${nome}`}>
      <div className="mb-1 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h2 className="text-base font-semibold text-ink">
          Fase {fase} · {nome}
        </h2>
        <Situacao tom={SITUACAO_FASE[situacao]}>{rotuloFase}</Situacao>
      </div>
      <p className="mb-4 text-sm text-muted">
        {descricao}
        {final && (
          <>
            {' '}
            {fase === FASES.length ? 'O projeto termina' : 'Passa para a fase seguinte'} quando a etapa <strong className="font-medium text-ink">{EVENTOS[final].nome}</strong> é marcada.
          </>
        )}
      </p>

      <Lista>
        {etapasDaFase(processo, fase, dia).map((etapa) => {
          const estado = estadoDaEtapa(etapa, situacao)
          const { Icone, cor, rotulo, tom } = ESTADO[estado]
          const { info, tipo } = etapa
          const abertos = prazos.filter((p) => p.regra.cumpridoPor === tipo && estaAberto(p, dia))
          const podeMarcar = editar && ((estado !== 'feita' && estado !== 'planejada') || info.repete)
          return (
            <li key={tipo} className="flex gap-3 px-4 py-3">
              <Icone className={`mt-0.5 size-5 shrink-0 ${cor}`} aria-hidden />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-baseline justify-between gap-x-4">
                  <p className="font-medium text-ink">
                    {info.nome}
                    {info.fecha && <span className="ml-2 text-xs font-normal text-subtle">etapa final</span>}
                  </p>
                  <Situacao tom={tom}>{rotulo}</Situacao>
                </div>
                <p className="text-xs text-muted">
                  Quem faz: {info.quem} · {info.diario ? 'chega pelo Diário Oficial (ou marque aqui)' : 'marcada aqui pela equipe'}
                  {info.quando && ` · ${info.quando}`}
                </p>
                {etapa.feitos.map((evento) => (
                  <Ocorrencia key={evento.id} evento={evento} />
                ))}
                {etapa.planejados.map((evento) => (
                  <Ocorrencia key={evento.id} evento={evento} planejada />
                ))}
                {abertos.map((prazo) => (
                  <p key={prazo.id} className="mt-1 flex flex-wrap items-center gap-x-2 text-sm text-muted">
                    {prazo.regra.titulo}: <SituacaoPrazo prazo={prazo} hoje={dia} />
                  </p>
                ))}
                {info.ajuda && estado !== 'feita' && <p className="mt-1 text-xs text-subtle">{info.ajuda}</p>}
                {podeMarcar && (
                  <Expansivel resumo={etapa.feitos.length ? 'Marcar de novo' : info.planejada ? 'Marcar a data' : 'Marcar como feita'} className="mt-2">
                    <FormularioEtapa
                      processoId={processo.id}
                      tipo={tipo}
                      info={info}
                      dia={dia}
                      prazoPadrao={REGRAS_SVMA.find((r) => r.gatilho === tipo && r.unidade === 'dias_corridos')?.quantidade}
                      pedirSei={tipo === 'autuacao' && !processo.numeroSei}
                    />
                  </Expansivel>
                )}
              </div>
            </li>
          )
        })}
      </Lista>
    </section>
  )
}

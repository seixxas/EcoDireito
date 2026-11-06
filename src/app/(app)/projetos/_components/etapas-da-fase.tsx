import { SituacaoPrazo } from '@/components/prazos/situacao-prazo'
import type { Tom } from '@/components/ui/badge'
import { Expansivel } from '@/components/ui/expansivel'
import { Situacao } from '@/components/ui/situacao'
import { Zona } from '@/components/ui/zona'
import { estaAberto, REGRAS_SVMA, type Prazo } from '@/domain/prazos'
import { conclusaoDaFase, EVENTOS, etapasDaFase, FASES, situacaoDaFase, TIPOS_EVENTO, type Etapa, type Evento, type NumeroFase, type Processo, type SituacaoFase } from '@/domain/processos'
import { cn } from '@/lib/cn'
import type { DataISO } from '@/lib/datas'
import { formatarData } from '@/lib/formatar'
import { FormularioEtapa } from './formulario-etapa'

type EstadoEtapa = 'feita' | 'planejada' | 'pendente' | 'nao_houve' | 'sem_registro'

const ESTADO: Record<EstadoEtapa, { rotulo: string; tom: Tom; marca?: string }> = {
  feita: { rotulo: 'Feita', tom: 'ok', marca: '✓' },
  planejada: { rotulo: 'Data marcada', tom: 'warn' },
  pendente: { rotulo: 'Falta', tom: 'neutral' },
  nao_houve: { rotulo: 'Não houve', tom: 'neutral', marca: '–' },
  sem_registro: { rotulo: 'Sem registro', tom: 'neutral', marca: '–' },
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
    <p className="text-xs text-ink">
      <span className="font-medium">{planejada ? `Marcada para ${formatarData(evento.data)}` : formatarData(evento.data)}</span>
      <span className="text-muted"> · {evento.origem === 'diario' ? 'Diário Oficial' : 'Equipe'}</span>
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
    <Zona tom="proximos" titulo={`Fase ${fase} · ${nome}`} acao={<Situacao tom={SITUACAO_FASE[situacao]}>{rotuloFase}</Situacao>}>
      <p className="mb-1.5 max-w-[100ch] px-1 text-xs text-muted">
        {descricao}
        {final && (
          <>
            {' '}
            {fase === FASES.length ? 'O projeto termina' : 'Passa para a fase seguinte'} quando a etapa <strong className="font-medium text-ink">{EVENTOS[final].nome}</strong> é marcada.
          </>
        )}
      </p>

      <ul>
        {etapasDaFase(processo, fase, dia).map((etapa) => {
          const estado = estadoDaEtapa(etapa, situacao)
          const { marca, rotulo, tom } = ESTADO[estado]
          const { info, tipo } = etapa
          const abertos = prazos.filter((p) => p.regra.cumpridoPor === tipo && estaAberto(p, dia))
          const podeMarcar = editar && ((estado !== 'feita' && estado !== 'planejada') || info.repete)
          return (
            <li key={tipo} className="relative mb-px bg-surface px-3 py-2 first:rounded-t-md last:mb-0 last:rounded-b-md">
              <div className="flex gap-2.5">
                <span
                  aria-hidden
                  className={cn(
                    'mt-px flex size-5 shrink-0 items-center justify-center rounded-sm border text-xs font-semibold',
                    estado === 'feita' ? 'border-brand-700 bg-brand-700 text-on-brand' : 'border-campo text-subtle',
                  )}
                >
                  {marca}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                    <p className="text-sm font-medium text-ink">{info.nome}</p>
                    <Situacao tom={tom}>{rotulo}</Situacao>
                    {info.fecha && <Situacao tom="brand">Etapa final</Situacao>}
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
                    <p key={prazo.id} className="mt-0.5 flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-xs text-muted">
                      {prazo.regra.titulo}: <SituacaoPrazo prazo={prazo} hoje={dia} />
                    </p>
                  ))}
                  {info.ajuda && estado !== 'feita' && <p className="text-xs text-muted">{info.ajuda}</p>}
                </div>
              </div>
              {podeMarcar && (
                // O `after` do botão fica em cima da caixa da etapa: clicar nela também abre o formulário.
                <Expansivel
                  resumo={etapa.feitos.length ? 'Marcar de novo' : info.planejada ? 'Marcar a data' : 'Marcar como feita'}
                  className="ml-7.5 [&>summary]:after:absolute [&>summary]:after:left-3 [&>summary]:after:top-2 [&>summary]:after:size-5"
                >
                  <div className="rounded-md bg-painel p-3">
                    <FormularioEtapa
                      processoId={processo.id}
                      tipo={tipo}
                      info={info}
                      dia={dia}
                      prazoPadrao={REGRAS_SVMA.find((r) => r.gatilho === tipo && r.unidade === 'dias_corridos')?.quantidade}
                      pedirSei={tipo === 'autuacao' && !processo.numeroSei}
                    />
                  </div>
                </Expansivel>
              )}
            </li>
          )
        })}
      </ul>
    </Zona>
  )
}

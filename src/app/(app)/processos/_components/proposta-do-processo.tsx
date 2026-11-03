import { Leaf } from 'lucide-react'
import Link from 'next/link'
import { Expansivel } from '@/components/ui/expansivel'
import { Situacao } from '@/components/ui/situacao'
import type { Parcela } from '@/domain/financeiro/parcelas'
import { EVENTOS, FASES, type Cliente, type Processo, type TipoEvento } from '@/domain/processos'
import { DIAS_PARA_RETORNO, validaAte, type Proposta, type situacaoDaProposta } from '@/domain/propostas'
import type { DataISO } from '@/lib/datas'
import { somar } from '@/lib/dinheiro'
import { brl, contar, formatarData } from '@/lib/formatar'
import { BotaoImprimir } from './botao-imprimir'
import { FormularioEtapa } from './formulario-etapa'
import { FormularioTextoProposta } from './formulario-texto-proposta'

type Props = {
  processo: Processo
  cliente: Cliente
  proposta: Proposta
  situacao: ReturnType<typeof situacaoDaProposta>
  /** Vazio para quem não vê o financeiro: o documento sai sem valores. */
  parcelas: Parcela[]
  dia: DataISO
  /** Pode marcar etapas (enviada, aprovada, recusada). */
  marcar: boolean
  /** Pode mudar o texto. */
  editarTexto: boolean
}

const porExtenso = (data: DataISO) => new Intl.DateTimeFormat('pt-BR', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(data))

function Acao({ processoId, tipo, dia, resumo, rotuloBotao, rotuloObservacao }: { processoId: string; tipo: TipoEvento; dia: DataISO; resumo: string; rotuloBotao: string; rotuloObservacao?: string }) {
  return (
    <Expansivel resumo={resumo}>
      <div className="rounded-lg border border-line bg-surface p-4">
        <FormularioEtapa processoId={processoId} tipo={tipo} info={EVENTOS[tipo]} dia={dia} rotuloBotao={rotuloBotao} rotuloObservacao={rotuloObservacao} />
      </div>
    </Expansivel>
  )
}

/** A aba Proposta: em que pé está, o que fazer agora e o documento para imprimir ou salvar em PDF. */
export function PropostaDoProcesso({ processo, cliente, proposta, situacao, parcelas, dia, marcar, editarTexto }: Props) {
  const total = parcelas.length ? somar(parcelas.map((p) => p.valor)) : undefined
  const ate = validaAte(proposta)
  const aberta = situacao.estado === 'elaboracao' || situacao.estado === 'enviada'
  const numero = `P-${proposta.criadaEm.slice(0, 4)}-${processo.id.slice(-4).toUpperCase()}`

  const status = {
    elaboracao: { tom: 'neutral' as const, texto: 'Em elaboração: ainda não foi enviada ao cliente.' },
    enviada: {
      tom: situacao.pedeRetorno ? ('warn' as const) : ('info' as const),
      texto: `Enviada em ${formatarData(situacao.enviadaEm ?? dia)}, há ${contar(situacao.diasSemResposta ?? 0, 'dia', 'dias')}.${situacao.pedeRetorno ? ` Passou de ${DIAS_PARA_RETORNO} dias sem resposta: vale ligar para o cliente.` : ''}`,
    },
    aprovada: { tom: 'ok' as const, texto: `Aprovada em ${formatarData(situacao.aprovadaEm ?? dia)}. O processo seguiu para a fase ${FASES[processo.faseAtual - 1].nome}.` },
    recusada: { tom: 'danger' as const, texto: `Recusada em ${formatarData(situacao.recusadaEm ?? dia)}.${situacao.motivo ? ` Motivo: ${situacao.motivo}` : ''}` },
  }[situacao.estado]

  return (
    <>
      <div className="mb-5 space-y-3 print:hidden">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Situacao tom={status.tom} className="whitespace-normal">
            {status.texto}
          </Situacao>
          <BotaoImprimir />
        </div>
        {marcar && aberta && (
          <div className="flex flex-wrap items-start gap-2">
            {situacao.estado === 'elaboracao' && (
              <Acao processoId={processo.id} tipo="proposta_enviada" dia={dia} resumo="Marcar como enviada" rotuloBotao="Marcar como enviada" rotuloObservacao="Para quem foi enviada" />
            )}
            {situacao.estado === 'enviada' && (
              <>
                <Acao processoId={processo.id} tipo="aceite_proposta" dia={dia} resumo="Cliente aprovou" rotuloBotao="Aprovar e passar para a Documentação" />
                <Acao processoId={processo.id} tipo="proposta_recusada" dia={dia} resumo="Cliente recusou" rotuloBotao="Marcar como recusada" rotuloObservacao="Motivo" />
              </>
            )}
            {editarTexto && (
              <Expansivel resumo="Editar o texto">
                <div className="rounded-lg border border-line bg-surface p-4">
                  <FormularioTextoProposta proposta={proposta} />
                </div>
              </Expansivel>
            )}
          </div>
        )}
        {situacao.estado === 'aprovada' && (
          <p className="text-sm text-muted">
            A 1ª parcela já pode ser faturada (aba{' '}
            <Link href={`/processos/${processo.id}?aba=cobranca`} className="link">
              Cobrança
            </Link>
            ). Próximas etapas na{' '}
            <Link href={`/processos/${processo.id}?aba=etapas`} className="link">
              fase {FASES[processo.faseAtual - 1].nome}
            </Link>
            .
          </p>
        )}
      </div>

      <article className="max-w-3xl rounded-lg border border-line bg-surface px-8 py-7 text-ink print:max-w-none print:border-0 print:px-0 print:py-0">
        <header className="flex items-start justify-between gap-4 border-b border-line pb-4">
          <div className="flex items-center gap-2">
            <span className="flex size-8 items-center justify-center rounded-md bg-brand-700 text-on-brand">
              <Leaf className="size-4" />
            </span>
            <div>
              <p className="font-display text-lg font-semibold leading-tight">Eco Direito Ambiental</p>
              <p className="text-xs text-muted">Licenciamento e manejo ambiental</p>
            </div>
          </div>
          <div className="text-right text-sm">
            <p className="font-medium">Proposta de serviços</p>
            <p className="text-muted">
              {numero} · São Paulo, {porExtenso(proposta.criadaEm)}
            </p>
          </div>
        </header>

        <dl className="mt-5 grid gap-x-6 gap-y-2 text-sm sm:grid-cols-[9rem_1fr]">
          <dt className="text-muted">Para</dt>
          <dd>
            {cliente.nome} <span className="text-muted">· {cliente.documento}</span>
          </dd>
          <dt className="text-muted">Empreendimento</dt>
          <dd>
            {processo.empreendimento}
            {processo.endereco && <span className="text-muted"> · {processo.endereco}</span>}
          </dd>
          <dt className="text-muted">Serviço</dt>
          <dd>{processo.servico === 'manejo' ? 'Manejo arbóreo' : 'Licenciamento ambiental'}</dd>
        </dl>

        <h3 className="mt-6 text-sm font-semibold">1. O que será feito</h3>
        <p className="mt-1 whitespace-pre-line text-sm leading-relaxed">{proposta.escopo}</p>

        {total !== undefined && (
          <>
            <h3 className="mt-6 text-sm font-semibold">2. Investimento e forma de pagamento</h3>
            <table className="mt-2 w-full text-sm">
              <tbody>
                {parcelas.map((parcela) => (
                  <tr key={parcela.id} className="border-b border-line">
                    <td className="py-1.5">
                      {parcela.descricao}
                      <span className="block text-xs text-muted">Quando: {EVENTOS[parcela.gatilho].nome}</span>
                    </td>
                    <td className="py-1.5 text-right tabular-nums">{brl(parcela.valor)}</td>
                  </tr>
                ))}
                <tr>
                  <td className="pt-2 font-semibold">Total</td>
                  <td className="pt-2 text-right font-semibold tabular-nums">{brl(total)}</td>
                </tr>
              </tbody>
            </table>
          </>
        )}

        <h3 className="mt-6 text-sm font-semibold">{total !== undefined ? '3.' : '2.'} Validade</h3>
        <p className="mt-1 text-sm">
          {contar(proposta.validadeDias, 'dia', 'dias')}, até {formatarData(ate)}.{ate < dia && aberta && <span className="text-danger"> Vencida: confirme os valores antes de reenviar.</span>}
        </p>

        <footer className="mt-8 border-t border-line pt-4 text-sm text-muted">
          {processo.responsavel ? `${processo.responsavel} · ` : ''}Eco Direito Ambiental
        </footer>
      </article>
    </>
  )
}

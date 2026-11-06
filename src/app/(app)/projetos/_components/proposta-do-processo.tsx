import { LinkRapido } from '@/components/ui/link-rapido'
import { Expansivel } from '@/components/ui/expansivel'
import { Zona } from '@/components/ui/zona'
import type { Parcela } from '@/domain/financeiro/parcelas'
import { EVENTOS, FASES, type Cliente, type Processo, type TipoEvento } from '@/domain/processos'
import { DIAS_PARA_RETORNO, ESTADOS_PROPOSTA, validaAte, type Proposta, type situacaoDaProposta } from '@/domain/propostas'
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

const ACAO = 'open:w-full xl:w-full [&>summary]:w-full [&>summary]:justify-center'

/** Formulário numa coluna estreita: uma coluna de campos e botão que quebra a linha, senão "Aprovar e passar para a Documentação" estoura a tela. */
const CAIXA = 'rounded-lg bg-surface p-4 xl:[&_.grid]:grid-cols-1 [&_button]:whitespace-normal [&_button]:py-2'

const porExtenso = (data: DataISO) => new Intl.DateTimeFormat('pt-BR', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(data))

function Acao({ processoId, tipo, dia, resumo, rotuloBotao, rotuloObservacao }: { processoId: string; tipo: TipoEvento; dia: DataISO; resumo: string; rotuloBotao: string; rotuloObservacao?: string }) {
  return (
    <Expansivel resumo={resumo} className={ACAO}>
      <div className={CAIXA}>
        <FormularioEtapa processoId={processoId} tipo={tipo} info={EVENTOS[tipo]} dia={dia} rotuloBotao={rotuloBotao} rotuloObservacao={rotuloObservacao} />
      </div>
    </Expansivel>
  )
}

/** A aba Proposta: em que pé está, o que fazer agora e o documento para imprimir ou salvar em PDF. No papel a letra é menor que na tela e o texto é sempre preto, mesmo no tema escuro. */
export function PropostaDoProcesso({ processo, cliente, proposta, situacao, parcelas, dia, marcar, editarTexto }: Props) {
  const total = parcelas.length ? somar(parcelas.map((p) => p.valor)) : undefined
  const ate = validaAte(proposta)
  const aberta = situacao.estado === 'elaboracao' || situacao.estado === 'enviada'
  const numero = `P-${proposta.criadaEm.slice(0, 4)}-${processo.id.slice(-4).toUpperCase()}`

  const status = {
    elaboracao: { tom: 'neutra' as const, texto: 'Ainda não foi enviada ao cliente.' },
    enviada: {
      tom: situacao.pedeRetorno ? ('hoje' as const) : ('neutra' as const),
      texto: `Enviada em ${formatarData(situacao.enviadaEm ?? dia)}, há ${contar(situacao.diasSemResposta ?? 0, 'dia', 'dias')}.${situacao.pedeRetorno ? ` Passou de ${DIAS_PARA_RETORNO} dias sem resposta: vale ligar para o cliente.` : ''}`,
    },
    aprovada: { tom: 'proximos' as const, texto: `Aprovada em ${formatarData(situacao.aprovadaEm ?? dia)}. O projeto seguiu para a fase ${FASES[processo.faseAtual - 1].nome}.` },
    recusada: { tom: 'apagada' as const, texto: `Recusada em ${formatarData(situacao.recusadaEm ?? dia)}.${situacao.motivo ? ` Motivo: ${situacao.motivo}` : ''}` },
  }[situacao.estado]

  return (
    <div className="grid grid-cols-1 items-start gap-x-8 gap-y-6 xl:grid-cols-[minmax(0,1fr)_25rem] print:block">
      <Zona tom={status.tom} titulo={ESTADOS_PROPOSTA[situacao.estado]} className="mb-0! xl:order-last print:hidden">
        <p className="mb-4">{status.texto}</p>
        {situacao.estado === 'aprovada' && (
          <p className="mb-4 text-sm">
            A 1ª parcela já pode ser faturada (aba{' '}
            <LinkRapido href={`/projetos/${processo.id}?aba=cobranca`} className="link">
              Cobrança
            </LinkRapido>
            ). Próximas etapas na{' '}
            <LinkRapido href={`/projetos/${processo.id}?aba=etapas`} className="link">
              fase {FASES[processo.faseAtual - 1].nome}
            </LinkRapido>
            .
          </p>
        )}
        <div className="mb-3 flex flex-wrap items-start gap-3">
          <BotaoImprimir className="xl:w-full" />
          {marcar && aberta && (
            <>
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
                <Expansivel resumo="Editar o texto" className={ACAO}>
                  <div className={CAIXA}>
                    <FormularioTextoProposta proposta={proposta} />
                  </div>
                </Expansivel>
              )}
            </>
          )}
        </div>
      </Zona>

      <article className="min-w-0 rounded-xl border border-line bg-surface px-5 py-6 text-ink sm:px-8 sm:py-7 print:rounded-none print:border-0 print:bg-transparent print:p-0 print:text-[11pt] print:text-black print:[&_*]:border-black/15 print:[&_*]:text-black">
        <header className="flex flex-wrap items-start justify-between gap-x-6 gap-y-3 border-b border-line pb-4">
          <div>
            <p className="text-xl font-semibold leading-tight print:text-[14pt]">Eco Direito Ambiental</p>
            <p className="text-xs text-muted print:text-[10pt]">Licenciamento e manejo ambiental</p>
          </div>
          <div className="grow sm:text-right">
            <p className="font-medium">Proposta de serviços</p>
            <p className="text-muted">
              {numero} · São Paulo, {porExtenso(proposta.criadaEm)}
            </p>
          </div>
        </header>

        <dl className="mt-5 grid gap-x-6 gap-y-2 sm:grid-cols-[10rem_minmax(0,1fr)] print:grid-cols-[9rem_minmax(0,1fr)]">
          <dt className="text-muted">Para</dt>
          <dd>
            {cliente.nome} <span className="whitespace-nowrap text-muted">· {cliente.documento}</span>
          </dd>
          <dt className="text-muted">Empreendimento</dt>
          <dd>
            {processo.empreendimento}
            {processo.endereco && <span className="text-muted"> · {processo.endereco}</span>}
          </dd>
          <dt className="text-muted">Serviço</dt>
          <dd>{processo.servico === 'manejo' ? 'Manejo arbóreo' : 'Licenciamento ambiental'}</dd>
        </dl>

        <h3 className="mt-6 text-lg font-semibold print:text-[11pt]">1. O que será feito</h3>
        <p className="mt-1 whitespace-pre-line leading-relaxed">{proposta.escopo}</p>

        {total !== undefined && (
          <>
            <h3 className="mt-6 text-lg font-semibold print:text-[11pt]">2. Investimento e forma de pagamento</h3>
            <table className="mt-2 w-full">
              <tbody>
                {parcelas.map((parcela) => (
                  <tr key={parcela.id} className="border-b border-line">
                    <td className="py-2">
                      {parcela.descricao}
                      <span className="block text-xs text-muted print:text-[10pt]">Quando: {EVENTOS[parcela.gatilho].nome}</span>
                    </td>
                    <td className="whitespace-nowrap py-2 pl-4 text-right">{brl(parcela.valor)}</td>
                  </tr>
                ))}
                <tr>
                  <td className="pt-2 font-semibold">Total</td>
                  <td className="whitespace-nowrap pl-4 pt-2 text-right font-semibold">{brl(total)}</td>
                </tr>
              </tbody>
            </table>
          </>
        )}

        <h3 className="mt-6 text-lg font-semibold print:text-[11pt]">{total !== undefined ? '3.' : '2.'} Validade</h3>
        <p className="mt-1">
          {contar(proposta.validadeDias, 'dia', 'dias')}, até {formatarData(ate)}.{ate < dia && aberta && <span className="text-danger"> Vencida: confirme os valores antes de reenviar.</span>}
        </p>

        <footer className="mt-8 border-t border-line pt-4 text-muted">
          {processo.responsavel ? `${processo.responsavel} · ` : ''}Eco Direito Ambiental
        </footer>
      </article>
    </div>
  )
}

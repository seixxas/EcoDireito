import { LinkRapido } from '@/components/ui/link-rapido'
import type { ReactNode } from 'react'
import { Card } from '@/components/ui/card'
import { Linha, Lista } from '@/components/ui/lista'
import { Secao } from '@/components/ui/secao'
import type { obterNota } from '@/data/financeiro'
import { mensagemDeCobranca, recebimentoSugerido } from '@/domain/financeiro/ciclo'
import { motivoParaNaoCancelar, saldoAReceber, situacaoNota, valorLiquido } from '@/domain/financeiro/notas'
import { nomeDaConta } from '@/domain/financeiro/plano-de-contas'
import { brl, formatarData } from '@/lib/formatar'
import { BotaoCancelarNota } from './botao-cancelar-nota'
import { FormularioRecebimento } from './formulario-recebimento'
import { MensagemDeCobranca } from './mensagem-de-cobranca'

function Dado({ rotulo, children }: { rotulo: string; children: ReactNode }) {
  return (
    <div>
      <dt className="text-xs font-semibold text-subtle">{rotulo}</dt>
      <dd className="mt-0.5 text-ink">{children}</dd>
    </div>
  )
}

export type AcaoDaNota = 'receber' | 'cobrar'

type Props = {
  dados: NonNullable<Awaited<ReturnType<typeof obterNota>>>
  editar: boolean
  /** No painel do Faturamento: o que vem primeiro, pronto para usar. */
  acao?: AcaoDaNota
}

/** Dados, histórico e ações da nota. O que é usado na página da nota e no painel do Faturamento. */
export function DetalheDaNota({ dados: { hoje: dia, nota, cliente, processo, parcela, lancamentos }, editar, acao }: Props) {
  const aberta = editar && !nota.cancelada
  const mensagem = aberta && acao === 'cobrar' && mensagemDeCobranca(nota, cliente.nome, dia)
  const sugestao = recebimentoSugerido(nota, dia)

  const recebimento = aberta && (
    <Card titulo={nota.recebimento ? 'Corrigir recebimento' : 'Registrar recebimento'}>
      {situacaoNota(nota, dia) === 'parcial' && (
        <p className="mb-4">
          Já entraram {brl(nota.recebimento!.valor)} em {formatarData(nota.recebimento!.data)} e faltam {brl(saldoAReceber(nota, dia))}. A nota guarda um recebimento só: para
          somar um novo pagamento, informe aqui o total recebido.
        </p>
      )}
      <FormularioRecebimento notaId={nota.id} data={sugestao.data} valor={sugestao.valor} />
    </Card>
  )

  return (
    <div className="@container">
      <div className="grid grid-cols-1 gap-6 @3xl:grid-cols-[minmax(0,1fr)_24rem] @3xl:gap-8">
        {mensagem && (
          <Card titulo="Cobrar">
            <MensagemDeCobranca texto={mensagem} />
          </Card>
        )}
        {acao === 'receber' && recebimento}

        <div className="min-w-0">
          <Card titulo="Nota">
            <dl className="grid grid-cols-1 gap-x-6 gap-y-4 @sm:grid-cols-2 @xl:grid-cols-3">
              <div className="@sm:col-span-2 @xl:col-span-3">
                <Dado rotulo="Serviço">{nota.descricao}</Dado>
              </div>
              <Dado rotulo="Emissão">{formatarData(nota.emissao)}</Dado>
              <Dado rotulo="Previsão de pagamento">{formatarData(nota.previsao)}</Dado>
              <Dado rotulo="Projeto">
                {processo ? (
                  <LinkRapido href={`/projetos/${processo.id}`} className="link inline-flex min-h-12 items-center">
                    {processo.empreendimento}
                  </LinkRapido>
                ) : (
                  '—'
                )}
                {parcela && <span className="block text-sm text-muted">{parcela.descricao}</span>}
              </Dado>
              <Dado rotulo="Valor">{brl(nota.valor)}</Dado>
              <Dado rotulo="ISS">{brl(nota.iss)}</Dado>
              <Dado rotulo="Retenção na fonte">{nota.retencao ? brl(nota.retencao) : '—'}</Dado>
              <Dado rotulo="Líquido a receber">
                <span className="text-[1.25rem] font-semibold">{brl(valorLiquido(nota))}</span>
              </Dado>
              <Dado rotulo="Recebido">{nota.recebimento ? `${brl(nota.recebimento.valor)} em ${formatarData(nota.recebimento.data)}` : '—'}</Dado>
            </dl>
          </Card>

          {lancamentos.length > 0 && (
            <Secao titulo="No caixa" className="mt-6!">
              <Lista>
                {lancamentos.map((lancamento) => (
                  <Linha key={lancamento.id} href={`/financeiro/lancamentos/${lancamento.id}`}>
                    <span className="whitespace-nowrap text-muted">{formatarData(lancamento.data)}</span>
                    <span className="min-w-48 flex-1">
                      {lancamento.descricao}
                      <span className="block text-sm text-muted">{nomeDaConta(lancamento.contaId)}</span>
                      {lancamento.observacao && <span className="block text-sm text-muted">Obs.: {lancamento.observacao}</span>}
                    </span>
                    <span className="text-[1.25rem] font-semibold">{brl(lancamento.valor)}</span>
                  </Linha>
                ))}
              </Lista>
            </Secao>
          )}
        </div>

        {aberta && (
          <div className="space-y-6">
            {acao !== 'receber' && recebimento}
            {!motivoParaNaoCancelar(nota) && (
              <Card titulo="Cancelar nota">
                <p className="mb-4">Quando a nota foi cancelada na Prefeitura. Ela continua na lista, riscada.</p>
                <BotaoCancelarNota notaId={nota.id} numero={nota.numero} resumo={`${cliente.nome} · ${brl(nota.valor)}`} />
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

import type { Metadata } from 'next'
import { LinkRapido } from '@/components/ui/link-rapido'
import { notFound } from 'next/navigation'
import type { Tom } from '@/components/ui/badge'
import { BotaoConfirmar } from '@/components/ui/botao-confirmar'
import { Card } from '@/components/ui/card'
import { classeBotao } from '@/components/ui/form'
import { PageHeader } from '@/components/ui/page-header'
import { Situacao } from '@/components/ui/situacao'
import { listarContratos } from '@/data/financeiro'
import { exigirArea } from '@/data/sessao'
import type { SituacaoParcela } from '@/domain/financeiro/parcelas'
import { somar } from '@/lib/dinheiro'
import { brl, formatarData } from '@/lib/formatar'
import { excluirParcela } from '../actions'
import { FormularioParcela } from './_components/formulario-parcela'

export const metadata: Metadata = { title: 'Contrato' }

const SITUACAO: Record<SituacaoParcela, { rotulo: string; tom: Tom }> = {
  aguardando: { rotulo: 'Aguardando o evento', tom: 'neutral' },
  liberada: { rotulo: 'Pronta para faturar', tom: 'warn' },
  faturada: { rotulo: 'Faturada', tom: 'info' },
  recebida: { rotulo: 'Recebida', tom: 'ok' },
}

export default async function PaginaContrato({ params }: { params: Promise<{ processoId: string }> }) {
  const [{ processoId }, contratos] = await Promise.all([params, listarContratos(), exigirArea('financeiro', 'editar')])
  const contrato = contratos.find((c) => c.processo.id === processoId)
  if (!contrato) notFound()
  const { processo, cliente, parcelas } = contrato

  return (
    <>
      <PageHeader
        voltar={{ href: '/financeiro/contratos', rotulo: 'Contratos' }}
        titulo={processo.empreendimento}
        resumo={`${cliente.nome} · contrato de ${brl(somar(parcelas.map((p) => p.parcela.valor)))}`}
        acoes={
          <LinkRapido href={`/projetos/${processo.id}`} className={classeBotao('secundario')}>
            Ver projeto
          </LinkRapido>
        }
      />

      <Card titulo="Parcelas" className="mb-6">
        {parcelas.length ? (
          <ul>
            {parcelas.map(({ parcela, situacao, nota, liberadaEm }) => (
              <li key={parcela.id} className="mb-3 rounded-lg bg-surface px-5 py-4.5">
                <div className="mb-3.5 flex flex-wrap items-center gap-x-4 gap-y-2.5">
                  <Situacao tom={SITUACAO[situacao].tom}>{SITUACAO[situacao].rotulo}</Situacao>
                  {situacao === 'liberada' && (
                    <>
                      <span className="text-xs text-muted">Liberada em {formatarData(liberadaEm!)}</span>
                      <LinkRapido href={`/financeiro/notas/nova?parcela=${parcela.id}`} className={classeBotao('primario')}>
                        Registrar nota
                      </LinkRapido>
                    </>
                  )}
                  {nota ? (
                    <LinkRapido href={`/financeiro/notas/${nota.id}`} className="link inline-flex min-h-12 items-center">
                      NF {nota.numero}
                    </LinkRapido>
                  ) : (
                    <form action={excluirParcela} className="ml-auto">
                      <input type="hidden" name="id" value={parcela.id} />
                      <BotaoConfirmar
                        titulo="Apagar esta parcela?"
                        oQue={`${parcela.descricao} · ${brl(parcela.valor)}`}
                        consequencia="A parcela sai do contrato. Não dá para desfazer."
                        sim="Sim, apagar a parcela"
                        variante="secundario"
                        className="border-danger! text-danger! hover:bg-danger-soft!"
                      >
                        Apagar parcela
                      </BotaoConfirmar>
                    </form>
                  )}
                </div>
                <FormularioParcela processoId={processo.id} parcela={parcela} />
              </li>
            ))}
          </ul>
        ) : (
          <p className="py-6 text-center text-lg text-muted">Este projeto ainda não tem parcelas.</p>
        )}
      </Card>

      <Card titulo="Nova parcela">
        <FormularioParcela processoId={processo.id} />
        <p className="mt-3 text-xs text-muted">Licenciamento costuma ter 3 parcelas (aceite da proposta, LAA e TCA); manejo, 50% na entrada e 50% no fim do corte.</p>
      </Card>
    </>
  )
}

import type { Metadata } from 'next'
import { PageHeader } from '@/components/ui/page-header'
import { dadosParaNovaNota } from '@/data/financeiro'
import { exigirArea } from '@/data/sessao'
import { DIAS_PARA_RECEBER } from '@/domain/financeiro/notas'
import { somarDias } from '@/lib/datas'
import { brl } from '@/lib/formatar'
import { FormularioNota } from './_components/formulario-nota'

export const metadata: Metadata = { title: 'Registrar nota' }

export default async function PaginaNovaNota({ searchParams }: { searchParams: Promise<{ parcela?: string }> }) {
  const [{ parcela: parcelaId }] = await Promise.all([searchParams, exigirArea('financeiro', 'editar')])
  const { hoje, clientes, processos, proximoNumero, deParcela } = await dadosParaNovaNota(parcelaId)
  const nomeDoCliente = (id: string) => clientes.find((c) => c.id === id)!.nome

  return (
    <div className="max-w-[55rem]">
      <PageHeader
        titulo="Registrar nota fiscal"
        voltar={{ href: '/financeiro', rotulo: 'Voltar para o Faturamento' }}
        resumo="A nota já emitida no site da Prefeitura. ISS (5%) e retenção (5,5%) saem do valor."
      />

      {deParcela && (
        <p className="mb-6 rounded-lg bg-warn-soft px-5 py-4 text-ink">
          Faturando a parcela <strong>{deParcela.parcela.descricao.toLowerCase()}</strong> ({brl(deParcela.parcela.valor)}) de{' '}
          <strong>{deParcela.processo.empreendimento}</strong>, {nomeDoCliente(deParcela.processo.clienteId)}.
        </p>
      )}

      <FormularioNota
        clientes={clientes.map((c) => ({ id: c.id, nome: c.nome }))}
        processos={processos.map((p) => ({ id: p.id, nome: `${p.empreendimento} · ${nomeDoCliente(p.clienteId)}` }))}
        padrao={{
          numero: proximoNumero,
          emissao: hoje,
          previsao: somarDias(hoje, DIAS_PARA_RECEBER),
          descricao: deParcela ? `${deParcela.parcela.descricao} · ${deParcela.processo.empreendimento}` : '',
          valor: deParcela?.parcela.valor,
          parcela: deParcela && { id: deParcela.parcela.id, clienteId: deParcela.processo.clienteId, processoId: deParcela.processo.id },
        }}
      />
    </div>
  )
}

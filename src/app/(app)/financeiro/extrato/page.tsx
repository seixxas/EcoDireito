import { Trash2 } from 'lucide-react'
import type { Metadata } from 'next'
import type { Tom } from '@/components/ui/badge'
import { BotaoEnviar } from '@/components/ui/botao-enviar'
import { Card } from '@/components/ui/card'
import { PageHeader } from '@/components/ui/page-header'
import { Stat } from '@/components/ui/stat'
import { filaDoExtrato } from '@/data/financeiro'
import { exigirArea } from '@/data/sessao'
import { notasParaCredito, sugerirTermo, type Sugestao } from '@/domain/financeiro/classificacao'
import { valorLiquido } from '@/domain/financeiro/notas'
import { nomeDaConta } from '@/domain/financeiro/plano-de-contas'
import { somar } from '@/lib/dinheiro'
import { brl, formatarData } from '@/lib/formatar'
import { pode } from '@/lib/permissoes'
import { confirmarTodas, devolverLinha, excluirRegra } from './actions'
import { FilaDoExtrato } from './_components/fila-do-extrato'
import { FormularioImportacao } from './_components/formulario-importacao'
import { FormularioRegra } from './_components/formulario-regra'

export const metadata: Metadata = { title: 'Extrato bancário' }

export default async function PaginaExtrato() {
  const [usuario, fila] = await Promise.all([exigirArea('financeiro'), filaDoExtrato()])
  const { pendentes, regras, ignoradas, lancadas, clientes, processos, notas } = fila
  const editar = pode(usuario.papel, 'financeiro', 'editar')
  const comSugestao = pendentes.filter((p) => p.sugestao).length
  const aReceber = notas.filter((n) => !n.cancelada && !n.recebimento)
  const nomeDoCliente = (id: string) => clientes.find((c) => c.id === id)!.nome
  const nomeDoProcesso = (id?: string) => processos.find((p) => p.id === id)?.empreendimento

  const descrever = (sugestao: Sugestao): { texto: string; tom: Tom } => {
    if (sugestao.tipo === 'lancamento') return { texto: `Já lançado: ${sugestao.lancamento.descricao} (${formatarData(sugestao.lancamento.data)})`, tom: 'info' }
    if (sugestao.tipo === 'nota') return { texto: `Recebimento da NF ${sugestao.nota.numero} · ${nomeDoCliente(sugestao.nota.clienteId)}`, tom: 'ok' }
    return { texto: `${nomeDaConta(sugestao.regra.contaId)} · regra “${sugestao.regra.contem}”`, tom: 'brand' }
  }

  return (
    <>
      <PageHeader
        titulo="Extrato bancário"
        descricao="Importe o extrato do banco e cada linha vira lançamento. O sistema reconhece o que já foi lançado à mão, acha a nota que cada crédito paga e sugere a conta pelas regras."
      />

      <div className="mb-6 grid gap-4 lg:grid-cols-4">
        {editar && (
          <Card titulo="Importar extrato" className="lg:col-span-2">
            <FormularioImportacao />
          </Card>
        )}
        <Stat rotulo="A classificar" valor={pendentes.length} detalhe={`${comSugestao} com sugestão · ${brl(somar(pendentes.map((p) => p.linha.valor)))}`} tom="warn" />
        <Stat rotulo="Já lançadas" valor={lancadas} detalhe="linhas do extrato que viraram lançamento" tom="ok" />
      </div>

      <Card
        titulo="A classificar"
        className="mb-6"
        acao={
          editar &&
          comSugestao > 0 && (
            <form action={confirmarTodas}>
              <BotaoEnviar className="py-1.5">Confirmar as {comSugestao} sugestões</BotaoEnviar>
            </form>
          )
        }
        flush
      >
        <FilaDoExtrato
          editar={editar}
          linhas={pendentes.map(({ linha, sugestao }) => ({
            id: linha.id,
            data: linha.data,
            descricao: linha.descricao,
            valor: linha.valor,
            sugestao: sugestao && descrever(sugestao),
            termo: sugerirTermo(linha.descricao),
            candidatas: linha.valor > 0 ? notasParaCredito(linha, aReceber, clientes).map((n) => n.id) : [],
          }))}
          processos={processos.map((p) => ({ id: p.id, nome: p.empreendimento }))}
          notas={aReceber.map((n) => ({ id: n.id, nome: `NF ${n.numero} · ${nomeDoCliente(n.clienteId)} · ${brl(valorLiquido(n))}` }))}
        />
      </Card>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card titulo="Regras de classificação" flush>
          {editar && (
            <div className="border-b border-line p-5">
              <FormularioRegra processos={processos.map((p) => ({ id: p.id, nome: p.empreendimento }))} />
            </div>
          )}
          <table className="tabela">
            <tbody>
              {regras.map((regra) => (
                <tr key={regra.id}>
                  <td>“{regra.contem}”</td>
                  <td>
                    {nomeDaConta(regra.contaId)}
                    {regra.processoId && <p className="text-xs text-muted">{nomeDoProcesso(regra.processoId)}</p>}
                  </td>
                  {editar && (
                    <td className="text-right">
                      <form action={excluirRegra}>
                        <input type="hidden" name="id" value={regra.id} />
                        <button title="Apagar regra" className="rounded-lg p-2 text-subtle hover:bg-danger-soft hover:text-danger">
                          <Trash2 className="size-4" />
                        </button>
                      </form>
                    </td>
                  )}
                </tr>
              ))}
              {regras.length === 0 && (
                <tr>
                  <td colSpan={3} className="py-8 text-center text-muted">
                    Nenhuma regra ainda. Ao classificar uma linha, marque “daqui em diante” para criar uma.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </Card>

        {ignoradas.length > 0 && (
          <Card titulo="Ignoradas" flush>
            <table className="tabela">
              <tbody>
                {ignoradas.map((linha) => (
                  <tr key={linha.id}>
                    <td className="whitespace-nowrap">{formatarData(linha.data)}</td>
                    <td>{linha.descricao}</td>
                    <td className="num">{brl(linha.valor)}</td>
                    {editar && (
                      <td className="text-right">
                        <form action={devolverLinha}>
                          <input type="hidden" name="linhaId" value={linha.id} />
                          <button className="whitespace-nowrap text-sm font-medium text-brand-700 hover:underline">Voltar para a fila</button>
                        </form>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        )}
      </div>
    </>
  )
}

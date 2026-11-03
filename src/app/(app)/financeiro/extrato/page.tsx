import { Trash2 } from 'lucide-react'
import type { Metadata } from 'next'
import { Abas } from '@/components/ui/abas'
import type { Tom } from '@/components/ui/badge'
import { BotaoEnviar } from '@/components/ui/botao-enviar'
import { Card } from '@/components/ui/card'
import { Expansivel, Vazio } from '@/components/ui/expansivel'
import { Linha, Lista } from '@/components/ui/lista'
import { PageHeader } from '@/components/ui/page-header'
import { Paginacao } from '@/components/ui/paginacao'
import { filaDoExtrato } from '@/data/financeiro'
import { exigirArea } from '@/data/sessao'
import { chaveDaSugestao, notasParaCredito, sugerirTermo, type Sugestao } from '@/domain/financeiro/classificacao'
import { valorLiquido } from '@/domain/financeiro/notas'
import { nomeDaConta } from '@/domain/financeiro/plano-de-contas'
import { brl, contar, formatarData } from '@/lib/formatar'
import { paginar } from '@/lib/paginar'
import { pode } from '@/lib/permissoes'
import { confirmarTodas, devolverLinha, excluirRegra } from './actions'
import { FilaDoExtrato } from './_components/fila-do-extrato'
import { FormularioImportacao } from './_components/formulario-importacao'
import { FormularioRegra } from './_components/formulario-regra'

export const metadata: Metadata = { title: 'Extrato bancário' }

export default async function PaginaExtrato({ searchParams }: { searchParams: Promise<{ aba?: string; pagina?: string }> }) {
  const [{ aba: pedida, pagina }, usuario, fila] = await Promise.all([searchParams, exigirArea('financeiro'), filaDoExtrato()])
  const { pendentes, regras, ignoradas, lancadas, clientes, processos, notas } = fila
  const aba = pedida === 'regras' || pedida === 'ignoradas' ? pedida : 'fila'
  const linkDaPagina = (n: number) => (aba === 'fila' ? `/financeiro/extrato?pagina=${n}` : `/financeiro/extrato?aba=${aba}&pagina=${n}`)
  const filaPaginada = paginar(pendentes, pagina)
  const regrasPaginadas = paginar(regras, pagina)
  const ignoradasPaginadas = paginar(ignoradas, pagina)
  const editar = pode(usuario.papel, 'financeiro', 'editar')
  const comSugestao = pendentes.filter((p) => p.sugestao).length
  const aReceber = notas.filter((n) => !n.cancelada && !n.recebimento)
  const nomeDoCliente = (id: string) => clientes.find((c) => c.id === id)!.nome
  const opcoesDeProcesso = processos.map((p) => ({ id: p.id, nome: p.empreendimento }))

  const descrever = (sugestao: Sugestao): { texto: string; tom: Tom } => {
    if (sugestao.tipo === 'lancamento') return { texto: `Já lançado: ${sugestao.lancamento.descricao} (${formatarData(sugestao.lancamento.data)})`, tom: 'info' }
    if (sugestao.tipo === 'nota') return { texto: `Recebimento da NF ${sugestao.nota.numero} · ${nomeDoCliente(sugestao.nota.clienteId)}`, tom: 'ok' }
    return { texto: `${nomeDaConta(sugestao.regra.contaId)} · regra “${sugestao.regra.contem}”`, tom: 'brand' }
  }

  return (
    <>
      <PageHeader
        titulo="Extrato bancário"
        resumo={
          pendentes.length
            ? `${contar(pendentes.length, 'linha', 'linhas')} a classificar, ${comSugestao} com sugestão pronta.`
            : lancadas
              ? `Nada a classificar: tudo o que foi importado já virou lançamento (${contar(lancadas, 'linha', 'linhas')}).`
              : 'Importe o extrato do banco: cada linha vira lançamento, com sugestão de conta e de nota.'
        }
        acoes={
          editar &&
          aba === 'fila' &&
          comSugestao > 0 && (
            <form action={confirmarTodas}>
              <BotaoEnviar>{comSugestao === 1 ? 'Confirmar a sugestão' : `Confirmar as ${comSugestao} sugestões`}</BotaoEnviar>
            </form>
          )
        }
      />

      {editar && (
        <Card className="mb-6">
          <FormularioImportacao />
        </Card>
      )}

      <Abas
        ativa={aba}
        abas={[
          { valor: 'fila', rotulo: 'A classificar', href: '/financeiro/extrato', contagem: pendentes.length },
          { valor: 'regras', rotulo: 'Regras', href: '/financeiro/extrato?aba=regras', contagem: regras.length },
          { valor: 'ignoradas', rotulo: 'Ignoradas', href: '/financeiro/extrato?aba=ignoradas', contagem: ignoradas.length },
        ]}
      />

      {aba === 'fila' && (
        <FilaDoExtrato
          editar={editar}
          linhas={filaPaginada.itens.map(({ linha, sugestao }) => ({
            id: linha.id,
            data: linha.data,
            descricao: linha.descricao,
            valor: linha.valor,
            sugestao: sugestao && { ...descrever(sugestao), chave: chaveDaSugestao(sugestao) },
            termo: sugerirTermo(linha.descricao),
            candidatas: linha.valor > 0 ? notasParaCredito(linha, aReceber, clientes).map(({ nota }) => nota.id) : [],
          }))}
          processos={opcoesDeProcesso}
          notas={aReceber.map((n) => ({ id: n.id, nome: `NF ${n.numero} · ${nomeDoCliente(n.clienteId)} · ${brl(valorLiquido(n))}` }))}
        />
      )}
      {aba === 'fila' && <Paginacao {...filaPaginada} href={linkDaPagina} />}

      {aba === 'regras' && (
        <>
          {editar && (
            <Expansivel resumo="Nova regra" className="mb-4">
              <Card>
                <FormularioRegra processos={opcoesDeProcesso} />
              </Card>
            </Expansivel>
          )}
          {regras.length ? (
            <Lista>
              {regrasPaginadas.itens.map((regra) => (
                <Linha key={regra.id}>
                  <span className="min-w-0 flex-1">
                    Descrição com “{regra.contem}”
                    {regra.processoId && <span className="block text-sm text-muted">{processos.find((p) => p.id === regra.processoId)?.empreendimento}</span>}
                  </span>
                  <span className="text-muted">{nomeDaConta(regra.contaId)}</span>
                  {editar && (
                    <form action={excluirRegra}>
                      <input type="hidden" name="id" value={regra.id} />
                      <button title="Apagar regra" className="rounded-md p-1.5 text-subtle hover:bg-danger-soft hover:text-danger">
                        <Trash2 className="size-4" />
                      </button>
                    </form>
                  )}
                </Linha>
              ))}
            </Lista>
          ) : (
            <Vazio>Nenhuma regra ainda. Ao classificar uma linha, marque “daqui em diante” para criar uma.</Vazio>
          )}
          <Paginacao {...regrasPaginadas} href={linkDaPagina} />
        </>
      )}

      {aba === 'ignoradas' &&
        (ignoradas.length ? (
          <>
            <Lista>
              {ignoradasPaginadas.itens.map((linha) => (
                <Linha key={linha.id}>
                  <span className="w-24 text-muted">{formatarData(linha.data)}</span>
                  <span className="min-w-0 flex-1">{linha.descricao}</span>
                  <span className="tabular-nums">{brl(linha.valor)}</span>
                  {editar && (
                    <form action={devolverLinha}>
                      <input type="hidden" name="linhaId" value={linha.id} />
                      <button className="link whitespace-nowrap text-sm">Voltar para a fila</button>
                    </form>
                  )}
                </Linha>
              ))}
            </Lista>
            <Paginacao {...ignoradasPaginadas} href={linkDaPagina} />
          </>
        ) : (
          <Vazio>Nenhuma linha ignorada.</Vazio>
        ))}
    </>
  )
}

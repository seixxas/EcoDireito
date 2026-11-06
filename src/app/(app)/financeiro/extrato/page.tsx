import type { Metadata } from 'next'
import { Abas } from '@/components/ui/abas'
import type { Tom } from '@/components/ui/badge'
import { BotaoConfirmar } from '@/components/ui/botao-confirmar'
import { BotaoEnviar } from '@/components/ui/botao-enviar'
import { Busca } from '@/components/ui/busca'
import { Card } from '@/components/ui/card'
import { Expansivel } from '@/components/ui/expansivel'
import { Linha, Lista } from '@/components/ui/lista'
import { PageHeader } from '@/components/ui/page-header'
import { Paginacao } from '@/components/ui/paginacao'
import { filaDoExtrato } from '@/data/financeiro'
import { exigirArea } from '@/data/sessao'
import { chaveDaSugestao, notasParaCredito, sugerirTermo, type Sugestao } from '@/domain/financeiro/classificacao'
import { valorLiquido } from '@/domain/financeiro/notas'
import { nomeDaConta } from '@/domain/financeiro/plano-de-contas'
import { combina } from '@/lib/buscar'
import { brl, contar, formatarData } from '@/lib/formatar'
import { paginar } from '@/lib/paginar'
import { pode } from '@/lib/permissoes'
import { confirmarTodas, devolverLinha, excluirRegra } from './actions'
import { CaixaVazia } from './_components/caixa-vazia'
import { FilaDoExtrato } from './_components/fila-do-extrato'
import { FormularioImportacao } from './_components/formulario-importacao'
import { FormularioRegra } from './_components/formulario-regra'

export const metadata: Metadata = { title: 'Extrato bancário' }

type Filtros = { aba?: string; q?: string; pagina?: string }

export default async function PaginaExtrato({ searchParams }: { searchParams: Promise<Filtros> }) {
  const [filtros, usuario, fila] = await Promise.all([searchParams, exigirArea('financeiro'), filaDoExtrato()])
  const { clientes, processos, notas, lancadas } = fila
  const aba = filtros.aba === 'regras' || filtros.aba === 'ignoradas' ? filtros.aba : 'fila'
  const q = filtros.q?.trim() || undefined
  const link = (novos: Filtros) => {
    const f = { aba, q, ...novos }
    const params = new URLSearchParams()
    if (f.aba && f.aba !== 'fila') params.set('aba', f.aba)
    if (f.q) params.set('q', f.q)
    if (f.pagina && f.pagina !== '1') params.set('pagina', f.pagina)
    return params.size ? `/financeiro/extrato?${params}` : '/financeiro/extrato'
  }
  const editar = pode(usuario.papel, 'financeiro', 'editar')
  const aReceber = notas.filter((n) => !n.cancelada && !n.recebimento)
  const nomeDoCliente = (id: string) => clientes.find((c) => c.id === id)!.nome
  const nomeDoProcesso = (id?: string) => processos.find((p) => p.id === id)?.empreendimento
  const opcoesDeProcesso = processos.map((p) => ({ id: p.id, nome: p.empreendimento }))

  const descrever = (sugestao: Sugestao): { texto: string; tom: Tom } => {
    if (sugestao.tipo === 'lancamento') return { texto: `Já lançado: ${sugestao.lancamento.descricao} (${formatarData(sugestao.lancamento.data)})`, tom: 'info' }
    if (sugestao.tipo === 'nota') return { texto: `Recebimento da NF ${sugestao.nota.numero} · ${nomeDoCliente(sugestao.nota.clienteId)}`, tom: 'ok' }
    return { texto: `${nomeDaConta(sugestao.regra.contaId)} · regra “${sugestao.regra.contem}”`, tom: 'brand' }
  }

  // A busca vale nas três abas: descrição e valor da linha, e o que a sugestão diz (NF, cliente, conta).
  const pendentes = fila.pendentes.filter(({ linha, sugestao }) => combina(q, linha.descricao, brl(linha.valor), sugestao && descrever(sugestao).texto))
  const regras = fila.regras.filter((regra) => combina(q, regra.contem, nomeDaConta(regra.contaId), nomeDoProcesso(regra.processoId)))
  const ignoradas = fila.ignoradas.filter((linha) => combina(q, linha.descricao, brl(linha.valor)))
  const filaPaginada = paginar(pendentes, filtros.pagina)
  const regrasPaginadas = paginar(regras, filtros.pagina)
  const ignoradasPaginadas = paginar(ignoradas, filtros.pagina)
  const linkDaPagina = (n: number) => link({ pagina: String(n) })
  const sugeridas = pendentes.flatMap(({ linha, sugestao }) => (sugestao ? [`${linha.id} ${chaveDaSugestao(sugestao)}`] : []))
  const comSugestao = sugeridas.length

  return (
    <>
      <PageHeader
        titulo="Extrato bancário"
        resumo={
          fila.pendentes.length
            ? `${contar(fila.pendentes.length, 'linha', 'linhas')} a classificar, ${fila.pendentes.filter((p) => p.sugestao).length} com sugestão pronta.`
            : lancadas
              ? `Nada a classificar: tudo o que foi importado já virou lançamento (${contar(lancadas, 'linha', 'linhas')}).`
              : 'Importe o extrato do banco: cada linha vira lançamento, com sugestão de conta e de nota.'
        }
        acoes={
          editar &&
          aba === 'fila' &&
          comSugestao > 0 && (
            <form action={confirmarTodas}>
              {sugeridas.map((item) => (
                <input key={item} type="hidden" name="item" value={item} />
              ))}
              <BotaoEnviar>
                {comSugestao === 1 ? 'Confirmar a sugestão' : `Confirmar as ${comSugestao} sugestões`}
                {q && ' encontradas'}
              </BotaoEnviar>
            </form>
          )
        }
      />

      {editar && (
        <Card titulo="Importar extrato" className="mb-9">
          <FormularioImportacao />
        </Card>
      )}

      <Abas
        className="w-fit max-w-full"
        ativa={aba}
        abas={[
          { valor: 'fila', rotulo: 'A classificar', href: link({ aba: 'fila' }), contagem: pendentes.length },
          { valor: 'regras', rotulo: 'Regras', href: link({ aba: 'regras' }), contagem: regras.length },
          { valor: 'ignoradas', rotulo: 'Ignoradas', href: link({ aba: 'ignoradas' }), contagem: ignoradas.length },
        ]}
      />

      <Busca
        valor={q}
        placeholder={aba === 'regras' ? 'Trecho, conta ou projeto' : 'Descrição, valor, NF ou cliente'}
        manter={{ aba: aba === 'fila' ? undefined : aba }}
        limpar={link({ q: undefined })}
        className="mb-6"
      />

      {aba === 'fila' && (
        <FilaDoExtrato
          vazio={q && `Nenhuma linha a classificar com “${q}”.`}
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
            <Expansivel resumo="Nova regra" className="mb-6">
              <Card>
                <FormularioRegra processos={opcoesDeProcesso} />
              </Card>
            </Expansivel>
          )}
          {regras.length ? (
            <Lista>
              {regrasPaginadas.itens.map((regra) => (
                <Linha key={regra.id}>
                  <span className="min-w-48 flex-1">
                    Descrição com “{regra.contem}”
                    {regra.processoId && <span className="block text-sm text-muted">{processos.find((p) => p.id === regra.processoId)?.empreendimento}</span>}
                  </span>
                  <span className="text-muted">{nomeDaConta(regra.contaId)}</span>
                  {editar && (
                    <form action={excluirRegra}>
                      <input type="hidden" name="id" value={regra.id} />
                      <BotaoConfirmar
                        titulo="Apagar esta regra?"
                        oQue={`Descrição com “${regra.contem}” · ${nomeDaConta(regra.contaId)}`}
                        consequencia="As próximas linhas com esse trecho não vão mais trazer esta sugestão."
                        sim="Sim, apagar a regra"
                        variante="secundario"
                      >
                        Apagar regra
                      </BotaoConfirmar>
                    </form>
                  )}
                </Linha>
              ))}
            </Lista>
          ) : (
            <CaixaVazia titulo={q ? `Nenhuma regra com “${q}”.` : 'Nenhuma regra ainda.'} detalhe={q ? undefined : 'Ao classificar uma linha, marque “daqui em diante” para criar uma.'} />
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
                  <span className="whitespace-nowrap text-muted">{formatarData(linha.data)}</span>
                  <span className="min-w-48 flex-1">{linha.descricao}</span>
                  <span className="whitespace-nowrap text-[1.25rem] font-semibold">{brl(linha.valor)}</span>
                  {editar && (
                    <form action={devolverLinha}>
                      <input type="hidden" name="linhaId" value={linha.id} />
                      <BotaoEnviar variante="secundario">Voltar para a fila</BotaoEnviar>
                    </form>
                  )}
                </Linha>
              ))}
            </Lista>
            <Paginacao {...ignoradasPaginadas} href={linkDaPagina} />
          </>
        ) : (
          <CaixaVazia titulo={q ? `Nenhuma linha ignorada com “${q}”.` : 'Nenhuma linha ignorada.'} />
        ))}
    </>
  )
}

import type { ReactNode } from 'react'
import { LinkRapido } from '@/components/ui/link-rapido'
import { SituacaoDaNota } from '@/components/financeiro/situacao-nota'
import { classeBotao } from '@/components/ui/form'
import type { ItemNota } from '@/data/financeiro'
import type { listarParcelasLiberadas } from '@/data/processos'
import { diasDeAtraso, saldoAReceber, situacaoNota, valorLiquido, type NotaFiscal } from '@/domain/financeiro/notas'
import { cn } from '@/lib/cn'
import type { DataISO } from '@/lib/datas'
import { brl, contar, formatarData, formatarDataNaLista } from '@/lib/formatar'
import { BotaoAbrir } from './abrir-linha'
import type { AcaoDaNota } from './detalhe-da-nota'
import { LinhaDaNota } from './linha-da-nota'

type LinkDaNota = (id: string, acao?: AcaoDaNota) => string

type Tabela = { itens: ItemNota[]; dia: DataISO; notaAberta?: string; linkDaNota: LinkDaNota }

/** Quem decide as colunas é a largura do bloco, não a da janela. Abaixo de `@3xl`, a linha vira uma coluna só, com tudo empilhado. */
function Grade({ children }: { children: ReactNode }) {
  return (
    <div className="@container overflow-x-auto">
      <table className="tabela min-w-0">{children}</table>
    </div>
  )
}

function Valor({ children }: { children: ReactNode }) {
  return <p className="mt-1 text-sm font-semibold @3xl:hidden">{children}</p>
}

function AcoesDaNota({ nota, linkDaNota }: { nota: NotaFiscal; linkDaNota: LinkDaNota }) {
  return (
    <>
      <LinkRapido href={linkDaNota(nota.id, 'receber')} scroll={false} aria-label={`Receber a NF ${nota.numero}`} className={classeBotao('secundario', undefined, 'pequeno')}>
        Receber
      </LinkRapido>
      <LinkRapido href={linkDaNota(nota.id, 'cobrar')} scroll={false} aria-label={`Cobrar a NF ${nota.numero}`} className={classeBotao('secundario', undefined, 'pequeno')}>
        Cobrar
      </LinkRapido>
    </>
  )
}

/** A vencer, Vencem hoje e Atrasadas (`comAtraso`). */
export function TabelaEmAberto({ itens, dia, notaAberta, linkDaNota, editar, comAtraso }: Tabela & { editar: boolean; comAtraso?: boolean }) {
  return (
    <Grade>
      <thead className="@max-3xl:hidden">
        <tr>
          <th>Cliente e NF</th>
          <th>Previsão</th>
          <th className="num">Saldo</th>
          <th className="num">Ação</th>
        </tr>
      </thead>
      <tbody>
        {itens.map(({ nota, cliente }) => {
          const atraso = diasDeAtraso(nota, dia)
          const parcial = situacaoNota(nota, dia) === 'parcial'
          const abrir = <BotaoAbrir href={linkDaNota(nota.id)} scroll={false} rotulo={`Abrir NF ${nota.numero}`} />
          const textoDoAtraso = comAtraso && `${contar(atraso, 'dia', 'dias')} de atraso`
          return (
            <LinhaDaNota key={nota.id} href={linkDaNota(nota.id)} aberta={nota.id === notaAberta}>
              <td>
                <span className="font-medium">{cliente.nome}</span>
                <p className="text-xs text-muted">
                  NF {nota.numero} · {nota.descricao} {parcial && <SituacaoDaNota situacao="parcial" />}
                </p>
                <p className="text-xs text-muted @3xl:hidden">
                  Previsão {formatarDataNaLista(nota.previsao, dia)}
                  {textoDoAtraso && ` · ${textoDoAtraso}`}
                </p>
                <Valor>
                  {brl(saldoAReceber(nota, dia))}
                  {parcial && <span className="block text-sm font-normal text-muted">de {brl(valorLiquido(nota))}</span>}
                </Valor>
                <div className={cn('mt-2 flex flex-wrap gap-2', editar ? '@5xl:hidden' : '@3xl:hidden')}>
                  {editar && <AcoesDaNota nota={nota} linkDaNota={linkDaNota} />}
                  <span className="@3xl:hidden">{abrir}</span>
                </div>
              </td>
              <td className="hidden whitespace-nowrap @3xl:table-cell">
                {formatarDataNaLista(nota.previsao, dia)}
                {textoDoAtraso && <p className={cn('text-sm', atraso > 30 ? 'font-medium text-danger' : 'text-warn')}>{textoDoAtraso}</p>}
              </td>
              <td className="num hidden @3xl:table-cell">
                {brl(saldoAReceber(nota, dia))}
                {parcial && <p className="text-sm font-normal text-muted">de {brl(valorLiquido(nota))}</p>}
              </td>
              <td className="hidden @3xl:table-cell">
                <div className="flex justify-end gap-1">
                  {editar && (
                    <div className="hidden gap-1 @5xl:flex">
                      <AcoesDaNota nota={nota} linkDaNota={linkDaNota} />
                    </div>
                  )}
                  {abrir}
                </div>
              </td>
            </LinhaDaNota>
          )
        })}
      </tbody>
    </Grade>
  )
}

export function TabelaRecebidas({ itens, notaAberta, linkDaNota }: Omit<Tabela, 'dia'>) {
  return (
    <Grade>
      <thead className="@max-3xl:hidden">
        <tr>
          <th>Cliente e NF</th>
          <th>Recebida em</th>
          <th className="num">Valor recebido</th>
          <th className="num">Ação</th>
        </tr>
      </thead>
      <tbody>
        {itens.map(({ nota, cliente }) => {
          const abrir = <BotaoAbrir href={linkDaNota(nota.id)} scroll={false} rotulo={`Abrir NF ${nota.numero}`} />
          return (
            <LinhaDaNota key={nota.id} href={linkDaNota(nota.id)} aberta={nota.id === notaAberta}>
              <td>
                <span className="font-medium">{cliente.nome}</span>
                <p className="text-xs text-muted">
                  NF {nota.numero} · {nota.descricao}
                </p>
                <p className="text-xs text-muted @3xl:hidden">Recebida em {formatarData(nota.recebimento!.data)}</p>
                <Valor>{brl(nota.recebimento!.valor)}</Valor>
                <div className="mt-2 @3xl:hidden">{abrir}</div>
              </td>
              <td className="hidden whitespace-nowrap @3xl:table-cell">{formatarData(nota.recebimento!.data)}</td>
              <td className="num hidden @3xl:table-cell">{brl(nota.recebimento!.valor)}</td>
              <td className="hidden text-right @3xl:table-cell">{abrir}</td>
            </LinhaDaNota>
          )
        })}
      </tbody>
    </Grade>
  )
}

export function TabelaTodas({ itens, dia, notaAberta, linkDaNota }: Tabela) {
  return (
    <Grade>
      <thead className="@max-3xl:hidden">
        <tr>
          <th>NF</th>
          <th className="hidden @min-[70rem]:table-cell">Emissão</th>
          <th>Cliente e serviço</th>
          <th className="num">Líquido</th>
          <th className="hidden @min-[58rem]:table-cell">Previsão</th>
          <th>Situação</th>
          <th className="num">Ação</th>
        </tr>
      </thead>
      <tbody>
        {itens.map(({ nota, cliente }) => {
          const abrir = <BotaoAbrir href={linkDaNota(nota.id)} scroll={false} rotulo={`Abrir NF ${nota.numero}`} />
          const situacao = <SituacaoDaNota situacao={situacaoNota(nota, dia)} />
          return (
            <LinhaDaNota key={nota.id} href={linkDaNota(nota.id)} aberta={nota.id === notaAberta} className={nota.cancelada ? 'text-subtle line-through decoration-subtle/50' : undefined}>
              <td className="hidden @3xl:table-cell">
                <LinkRapido href={linkDaNota(nota.id)} scroll={false} className="link">
                  {nota.numero}
                </LinkRapido>
              </td>
              <td className="hidden whitespace-nowrap @min-[70rem]:table-cell">{formatarData(nota.emissao)}</td>
              <td>
                <span className="font-medium">{cliente.nome}</span>
                <p className="text-xs text-muted">
                  <span className="@3xl:hidden">NF {nota.numero} · </span>
                  {nota.descricao}
                </p>
                <p className="text-xs text-muted @min-[70rem]:hidden">
                  Emissão {formatarData(nota.emissao)}
                  <span className="@min-[58rem]:hidden"> · Previsão {formatarData(nota.previsao)}</span>
                </p>
                <Valor>
                  {brl(valorLiquido(nota))}
                  {nota.retencao > 0 && <span className="block text-sm font-normal text-muted">de {brl(nota.valor)}</span>}
                </Valor>
                <div className="mt-2 flex flex-wrap items-center gap-2 @3xl:hidden">
                  {situacao}
                  {abrir}
                </div>
              </td>
              <td className="num hidden @3xl:table-cell">
                {brl(valorLiquido(nota))}
                {nota.retencao > 0 && <p className="text-sm font-normal text-muted">de {brl(nota.valor)}</p>}
              </td>
              <td className="hidden whitespace-nowrap @min-[58rem]:table-cell">{formatarData(nota.previsao)}</td>
              <td className="hidden whitespace-nowrap @3xl:table-cell">{situacao}</td>
              <td className="hidden text-right @3xl:table-cell">{abrir}</td>
            </LinhaDaNota>
          )
        })}
      </tbody>
    </Grade>
  )
}

export function TabelaAFaturar({ itens, editar }: { itens: Awaited<ReturnType<typeof listarParcelasLiberadas>>; editar: boolean }) {
  return (
    <Grade>
      <thead className="@max-3xl:hidden">
        <tr>
          <th>Projeto</th>
          <th className="hidden @5xl:table-cell">Parcela</th>
          <th className="hidden @5xl:table-cell">Cliente</th>
          <th>Liberada em</th>
          <th className="num">Valor</th>
          {editar && <th className="num">Ação</th>}
        </tr>
      </thead>
      <tbody>
        {itens.map(({ parcela, processo, cliente, liberadaEm }) => {
          const registrar = (
            <LinkRapido href={`/financeiro/notas/nova?parcela=${parcela.id}`} className={classeBotao('secundario', undefined, 'pequeno')}>
              Registrar nota
            </LinkRapido>
          )
          return (
            <tr key={parcela.id}>
              <td>
                <LinkRapido href={`/projetos/${processo.id}`} className="link text-ink hover:text-brand-700">
                  {processo.empreendimento}
                </LinkRapido>
                <p className="text-xs text-muted @5xl:hidden">
                  {parcela.descricao} · {cliente.nome}
                </p>
                <p className="text-xs text-muted @3xl:hidden">Liberada em {formatarData(liberadaEm!)}</p>
                <Valor>{brl(parcela.valor)}</Valor>
                {editar && <div className="mt-2 @3xl:hidden">{registrar}</div>}
              </td>
              <td className="hidden @5xl:table-cell">{parcela.descricao}</td>
              <td className="hidden @5xl:table-cell">{cliente.nome}</td>
              <td className="hidden whitespace-nowrap @3xl:table-cell">{formatarData(liberadaEm!)}</td>
              <td className="num hidden @3xl:table-cell">{brl(parcela.valor)}</td>
              {editar && <td className="hidden text-right @3xl:table-cell">{registrar}</td>}
            </tr>
          )
        })}
      </tbody>
    </Grade>
  )
}

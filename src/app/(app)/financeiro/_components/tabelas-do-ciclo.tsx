import Link from 'next/link'
import { SituacaoDaNota } from '@/components/financeiro/situacao-nota'
import { classeBotao } from '@/components/ui/form'
import type { ItemNota } from '@/data/financeiro'
import type { listarParcelasLiberadas } from '@/data/processos'
import { diasDeAtraso, saldoAReceber, situacaoNota, valorLiquido, type NotaFiscal } from '@/domain/financeiro/notas'
import { cn } from '@/lib/cn'
import type { DataISO } from '@/lib/datas'
import { brl, contar, formatarData, formatarDataCurta, formatarDataNaLista } from '@/lib/formatar'
import { AbrirLinha } from './abrir-linha'
import type { AcaoDaNota } from './detalhe-da-nota'
import { LinhaDaNota } from './linha-da-nota'

type LinkDaNota = (id: string, acao?: AcaoDaNota) => string

type Tabela = { itens: ItemNota[]; dia: DataISO; notaAberta?: string; linkDaNota: LinkDaNota }

function AcoesDaNota({ nota, linkDaNota }: { nota: NotaFiscal; linkDaNota: LinkDaNota }) {
  return (
    <div className="flex gap-2">
      <Link href={linkDaNota(nota.id, 'receber')} scroll={false} aria-label={`Receber a NF ${nota.numero}`} className={classeBotao('secundario')}>
        Receber
      </Link>
      <Link href={linkDaNota(nota.id, 'cobrar')} scroll={false} aria-label={`Cobrar a NF ${nota.numero}`} className={classeBotao('secundario')}>
        Cobrar
      </Link>
    </div>
  )
}

/** A vencer, Vencem hoje e Atrasadas (`comAtraso`). */
export function TabelaEmAberto({ itens, dia, notaAberta, linkDaNota, editar, comAtraso }: Tabela & { editar: boolean; comAtraso?: boolean }) {
  return (
    <table className="tabela">
      <thead>
        <tr>
          <th>Cliente e NF</th>
          <th className="hidden sm:table-cell">Previsão</th>
          {comAtraso && <th className="num hidden sm:table-cell">Atraso</th>}
          <th className="num">Saldo</th>
          {editar && <th className="hidden xl:table-cell" aria-label="Ações" />}
          <th />
        </tr>
      </thead>
      <tbody>
        {itens.map(({ nota, cliente }) => {
          const atraso = diasDeAtraso(nota, dia)
          const parcial = situacaoNota(nota, dia) === 'parcial'
          return (
            <LinhaDaNota key={nota.id} href={linkDaNota(nota.id)} aberta={nota.id === notaAberta}>
              <td className="sm:min-w-48">
                {cliente.nome}
                <p className="text-xs text-subtle">
                  NF {nota.numero} · {nota.descricao}
                </p>
                {parcial && <SituacaoDaNota situacao="parcial" />}
                {/* No celular, previsão, atraso e botões vêm para esta coluna. */}
                <p className="text-xs text-muted sm:hidden">
                  Previsão {formatarDataNaLista(nota.previsao, dia)}
                  {comAtraso && ` · ${contar(atraso, 'dia', 'dias')} de atraso`}
                </p>
                {editar && (
                  <div className="mt-2 xl:hidden">
                    <AcoesDaNota nota={nota} linkDaNota={linkDaNota} />
                  </div>
                )}
              </td>
              <td className="hidden whitespace-nowrap sm:table-cell">{formatarDataNaLista(nota.previsao, dia)}</td>
              {comAtraso && <td className={cn('num hidden sm:table-cell', atraso > 30 ? 'font-medium text-danger' : 'text-warn')}>{contar(atraso, 'dia', 'dias')}</td>}
              <td className="num font-medium">
                {brl(saldoAReceber(nota, dia))}
                {parcial && <p className="text-xs font-normal text-subtle">de {brl(valorLiquido(nota))}</p>}
              </td>
              {editar && (
                <td className="hidden xl:table-cell">
                  <AcoesDaNota nota={nota} linkDaNota={linkDaNota} />
                </td>
              )}
              <AbrirLinha href={linkDaNota(nota.id)} scroll={false} rotulo={`Abrir NF ${nota.numero}`} />
            </LinhaDaNota>
          )
        })}
      </tbody>
    </table>
  )
}

export function TabelaRecebidas({ itens, notaAberta, linkDaNota }: Omit<Tabela, 'dia'>) {
  return (
    <table className="tabela">
      <thead>
        <tr>
          <th>Cliente e NF</th>
          <th className="hidden sm:table-cell">Recebida em</th>
          <th className="num">Valor recebido</th>
          <th />
        </tr>
      </thead>
      <tbody>
        {itens.map(({ nota, cliente }) => (
          <LinhaDaNota key={nota.id} href={linkDaNota(nota.id)} aberta={nota.id === notaAberta}>
            <td className="sm:min-w-48">
              {cliente.nome}
              <p className="text-xs text-subtle">
                NF {nota.numero} · {nota.descricao}
              </p>
              <p className="text-xs text-muted sm:hidden">Recebida em {formatarData(nota.recebimento!.data)}</p>
            </td>
            <td className="hidden whitespace-nowrap sm:table-cell">{formatarData(nota.recebimento!.data)}</td>
            <td className="num font-medium">{brl(nota.recebimento!.valor)}</td>
            <AbrirLinha href={linkDaNota(nota.id)} scroll={false} rotulo={`Abrir NF ${nota.numero}`} />
          </LinhaDaNota>
        ))}
      </tbody>
    </table>
  )
}

export function TabelaTodas({ itens, dia, notaAberta, linkDaNota }: Tabela) {
  return (
    <table className="tabela">
      <thead>
        <tr>
          <th className="hidden sm:table-cell">NF</th>
          <th className="hidden xl:table-cell">Emissão</th>
          <th>Cliente e serviço</th>
          <th className="num">Líquido</th>
          <th className="hidden xl:table-cell">Previsão</th>
          <th className="hidden sm:table-cell">Situação</th>
          <th />
        </tr>
      </thead>
      <tbody>
        {itens.map(({ nota, cliente }) => (
          <LinhaDaNota key={nota.id} href={linkDaNota(nota.id)} aberta={nota.id === notaAberta} className={nota.cancelada ? 'text-subtle line-through decoration-subtle/50' : undefined}>
            <td className="hidden tabular-nums sm:table-cell">
              <Link href={linkDaNota(nota.id)} scroll={false} className="link">
                {nota.numero}
              </Link>
            </td>
            <td className="hidden whitespace-nowrap xl:table-cell">{formatarDataCurta(nota.emissao)}</td>
            <td className="sm:min-w-72">
              {cliente.nome}
              <p className="text-xs text-subtle">
                <span className="sm:hidden">NF {nota.numero} · </span>
                {nota.descricao}
              </p>
              {/* No celular as colunas NF e Situação somem; elas vêm para baixo do cliente. */}
              <span className="sm:hidden">
                <SituacaoDaNota situacao={situacaoNota(nota, dia)} />
              </span>
            </td>
            <td className="num font-medium">
              {brl(valorLiquido(nota))}
              {nota.retencao > 0 && <p className="text-xs font-normal text-subtle">de {brl(nota.valor)}</p>}
            </td>
            <td className="hidden whitespace-nowrap xl:table-cell">{formatarData(nota.previsao)}</td>
            <td className="hidden sm:table-cell">
              <SituacaoDaNota situacao={situacaoNota(nota, dia)} />
            </td>
            <AbrirLinha href={linkDaNota(nota.id)} scroll={false} rotulo={`Abrir NF ${nota.numero}`} />
          </LinhaDaNota>
        ))}
      </tbody>
    </table>
  )
}

export function TabelaAFaturar({ itens, editar }: { itens: Awaited<ReturnType<typeof listarParcelasLiberadas>>; editar: boolean }) {
  return (
    <table className="tabela">
      <thead>
        <tr>
          <th>Processo</th>
          <th className="hidden xl:table-cell">Parcela</th>
          <th className="hidden xl:table-cell">Cliente</th>
          <th className="hidden sm:table-cell">Liberada em</th>
          <th className="num">Valor</th>
          {editar && <th className="hidden sm:table-cell" aria-label="Ações" />}
        </tr>
      </thead>
      <tbody>
        {itens.map(({ parcela, processo, cliente, liberadaEm }) => {
          const registrar = (
            <Link href={`/financeiro/notas/nova?parcela=${parcela.id}`} className={classeBotao('secundario')}>
              Registrar nota
            </Link>
          )
          return (
            <tr key={parcela.id}>
              <td className="sm:min-w-48">
                <Link href={`/processos/${processo.id}`} className="link">
                  {processo.empreendimento}
                </Link>
                {/* Em tela estreita, parcela, cliente, data e botão vêm para esta coluna. */}
                <p className="text-xs text-subtle xl:hidden">
                  {parcela.descricao} · {cliente.nome}
                </p>
                <p className="text-xs text-muted sm:hidden">Liberada em {formatarData(liberadaEm!)}</p>
                {editar && <div className="mt-2 sm:hidden">{registrar}</div>}
              </td>
              <td className="hidden xl:table-cell">{parcela.descricao}</td>
              <td className="hidden xl:table-cell">{cliente.nome}</td>
              <td className="hidden whitespace-nowrap sm:table-cell">{formatarData(liberadaEm!)}</td>
              <td className="num font-medium">{brl(parcela.valor)}</td>
              {editar && <td className="hidden text-right sm:table-cell">{registrar}</td>}
            </tr>
          )
        })}
      </tbody>
    </table>
  )
}

import { Icone } from '@/components/ui/icone'
import { LinkRapido } from '@/components/ui/link-rapido'
import { listarPublicacoes } from '@/data/publicacoes'
import { contar, formatarDataCurta } from '@/lib/formatar'
import { CartaoResumo, Destaque } from './cartao'

const MOSTRAR = 4

/** Quantas publicações do Diário Oficial esperam revisão, para o número vermelho do menu. */
export async function contarPublicacoesNovas() {
  const { itens } = await listarPublicacoes()
  return itens.filter((item) => item.ato.status === 'nova').length
}

/** Cartão do Resumo: o que o robô achou no Diário Oficial e ainda espera alguém olhar. */
export async function CartaoDiario() {
  const { edicao, itens } = await listarPublicacoes()
  const novas = itens.filter((item) => item.ato.status === 'nova')

  return (
    <CartaoResumo icone="newspaper" titulo="Diário Oficial" href="/publicacoes" tom="azul">
      <Destaque icone="notifications" rotulo="Para revisar" valor={contar(novas.length, 'publicação', 'publicações')} tom="azul" />
      {novas.length === 0 ? (
        <p className="flex items-center gap-1.5 text-[0.84375rem] text-muted">
          <Icone nome="check_circle" cheio className="text-lg text-ok" />
          Nada novo para revisar.
        </p>
      ) : (
        <ul className="flex flex-col gap-1.5">
          {novas.slice(0, MOSTRAR).map(({ ato, cliente, processo }) => (
            <li key={ato.id}>
              <LinkRapido href="/publicacoes" className="flex items-center gap-2.5 rounded-[10px] bg-painel px-3 py-2 hover:bg-info-soft">
                <span className="inline-flex size-7 shrink-0 items-center justify-center rounded-lg bg-info-tag text-info">
                  <Icone nome="description" cheio className="text-base" />
                </span>
                <span className="flex min-w-0 flex-col">
                  <span className="truncate text-[0.84375rem] font-semibold text-ink">{ato.serie}</span>
                  <span className="truncate text-xs text-muted">{processo?.empreendimento ?? cliente.nome}</span>
                </span>
              </LinkRapido>
            </li>
          ))}
          {novas.length > MOSTRAR && <li className="px-1 text-xs text-muted">e mais {novas.length - MOSTRAR}</li>}
        </ul>
      )}
      <p className="mt-auto flex items-center gap-1.5 border-t border-line pt-3 text-xs text-muted">
        <Icone nome="event_available" className="text-base text-info" />
        Edição de {formatarDataCurta(edicao.data)} · {contar(edicao.atosSvma, 'ato da SVMA lido', 'atos da SVMA lidos')}
      </p>
    </CartaoResumo>
  )
}

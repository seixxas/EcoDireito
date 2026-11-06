'use client'

import { useActionState, useState, type ReactNode } from 'react'
import { BotaoConfirmar } from '@/components/ui/botao-confirmar'
import { BotaoEnviar } from '@/components/ui/botao-enviar'
import { Campo, Entrada, MensagemFormulario, Selecao, classeBotao } from '@/components/ui/form'
import { LinkRapido } from '@/components/ui/link-rapido'
import { MOTIVOS_PARA_IGNORAR } from '@/domain/publicacoes'
import { cn } from '@/lib/cn'
import { juntar } from '@/lib/formatar'
import { ignorarAto, lancarAto } from '../actions'

type Props = {
  id: string
  temProcesso: boolean
  marcaEtapa: boolean
  /** Do que se trata, na caixa de ignorar: "Comunique-se · Lumen Pompeia SPE Ltda · qui, 05/11". */
  oQue: string
  /** Títulos dos prazos que o lançamento abriria: a caixa de ignorar avisa que eles não serão abertos. */
  prazos: string[]
  /** No Diário, a ação principal é cheia e os botões ficam em coluna. No Hoje, ficam em linha e sem destaque. */
  emColuna?: boolean
  /** Botão a mais entre o lançar e o ignorar. */
  children?: ReactNode
}

function AvisoAoIgnorar({ prazos }: { prazos: string[] }) {
  const titulos = juntar(prazos.map((titulo) => `“${titulo}”`))
  return (
    <>
      O ato sai de “Para revisar” e vai para “Ignorados”.
      {prazos.length === 1 && ` O prazo ${titulos} não será aberto no projeto.`}
      {prazos.length > 1 && ` Os prazos ${titulos} não serão abertos no projeto.`}
    </>
  )
}

/**
 * Ações do ato: lançar no processo (ou marcar como visto, se a série não vira etapa) ou ignorar com motivo.
 * Sem processo cadastrado, o caminho é cadastrar a partir do ato; o cadastro já lança.
 */
export function AcoesPublicacao({ id, temProcesso, marcaEtapa, oQue, prazos, emColuna, children }: Props) {
  const [lancamento, lancar] = useActionState(lancarAto, {})
  const [ignorado, ignorar] = useActionState(ignorarAto, {})
  const [motivo, setMotivo] = useState('')
  const erroMotivo = ignorado.erros?.motivo ?? ignorado.erros?.outro
  const principal = emColuna ? 'primario' : 'secundario'
  const largura = emColuna ? 'xl:w-full' : undefined

  return (
    <div className={cn('flex flex-col gap-3', emColuna && 'w-full')}>
      <div className={cn('flex flex-wrap gap-3', emColuna && 'xl:flex-col')}>
        {temProcesso ? (
          <form action={lancar} className={largura}>
            <input type="hidden" name="id" value={id} />
            <BotaoEnviar variante={principal} className={largura}>
              {marcaEtapa ? 'Lançar no projeto' : 'Marcar como visto'}
            </BotaoEnviar>
          </form>
        ) : (
          <LinkRapido href={`/projetos/novo?ato=${encodeURIComponent(id)}`} className={classeBotao(principal, largura)}>
            {marcaEtapa ? 'Cadastrar o projeto e lançar' : 'Cadastrar o projeto'}
          </LinkRapido>
        )}
        {children}
        <form action={ignorar} className={largura}>
          <input type="hidden" name="id" value={id} />
          <BotaoConfirmar
            variante="secundario"
            className={largura}
            titulo="Ignorar este ato do Diário Oficial?"
            oQue={oQue}
            sim="Sim, ignorar o ato"
            consequencia={
              <>
                <p>
                  <AvisoAoIgnorar prazos={prazos} />
                </p>
                <Campo rotulo="Por que ignorar?" className="mt-4">
                  <Selecao name="motivo" value={motivo} onChange={(e) => setMotivo(e.target.value)} required>
                    <option value="" disabled>
                      Escolha o motivo
                    </option>
                    {MOTIVOS_PARA_IGNORAR.map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                    <option value="outro">Outro (escrever)</option>
                  </Selecao>
                </Campo>
                {motivo === 'outro' && (
                  <Campo rotulo="Motivo" className="mt-4">
                    <Entrada name="outro" defaultValue={ignorado.valores?.outro} placeholder="Escreva o motivo" required autoFocus />
                  </Campo>
                )}
              </>
            }
          >
            Ignorar
          </BotaoConfirmar>
        </form>
      </div>
      <MensagemFormulario estado={lancamento} />
      {erroMotivo && <MensagemFormulario estado={{ erro: erroMotivo }} />}
    </div>
  )
}

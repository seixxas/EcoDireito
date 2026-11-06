'use client'

import { useActionState } from 'react'
import { BotaoEnviar } from '@/components/ui/botao-enviar'
import { AreaTexto, Campo, Entrada, MensagemFormulario } from '@/components/ui/form'
import type { InfoEvento, TipoEvento } from '@/domain/processos'
import { lancarEvento } from '../actions'

type Props = {
  processoId: string
  tipo: TipoEvento
  info: InfoEvento
  dia: string
  /** Prazo padrão que a etapa abre, para explicar o campo de prazo do ato. */
  prazoPadrao?: number
  /** Autuação de processo ainda sem nº SEI. */
  pedirSei?: boolean
  rotuloBotao?: string
  rotuloObservacao?: string
}

/** Marca uma etapa da fase: só os campos que fazem sentido para ela. */
export function FormularioEtapa({ processoId, tipo, info, dia, prazoPadrao, pedirSei, rotuloBotao, rotuloObservacao = 'Observação' }: Props) {
  const [estado, acao] = useActionState(lancarEvento, {})
  const erros = estado.erros ?? {}
  return (
    <form action={acao} className="max-w-2xl space-y-4">
      <input type="hidden" name="processoId" value={processoId} />
      <input type="hidden" name="tipo" value={tipo} />
      <div className="grid gap-4 sm:grid-cols-2">
        <Campo rotulo={info.planejada ? 'Data planejada' : 'Quando aconteceu'} erro={erros.data}>
          <Entrada type="date" name="data" defaultValue={estado.valores?.data ?? dia} max={info.planejada ? undefined : dia} required />
        </Campo>
        {pedirSei && (
          <Campo rotulo="Nº SEI gerado" erro={erros.numeroSei} dica="Pode preencher depois, em Editar.">
            <Entrada name="numeroSei" defaultValue={estado.valores?.numeroSei} placeholder="6027.2026/0000021-3" pattern="\d{4}\.\d{4}/\d{7}-\d" />
          </Campo>
        )}
        {info.prazoNoAto && (
          <Campo
            rotulo="O ato deu outro prazo? (dias)"
            erro={erros.diasNoAto}
            dica={`Deixe vazio para usar o padrão${prazoPadrao ? ` de ${prazoPadrao} dias` : ''}. Preencha só se o texto do ato disser outro, como "60 dias".`}
          >
            <Entrada type="number" name="diasNoAto" defaultValue={estado.valores?.diasNoAto} min={1} inputMode="numeric" placeholder={prazoPadrao ? String(prazoPadrao) : undefined} />
          </Campo>
        )}
      </div>
      <Campo rotulo={rotuloObservacao} erro={erros.observacao} dica="Opcional. Aparece na linha do tempo.">
        <AreaTexto name="observacao" defaultValue={estado.valores?.observacao} rows={2} placeholder="Ex.: protocolo nº, o que a SVMA pediu, com quem falou" />
      </Campo>
      <MensagemFormulario estado={estado} />
      <BotaoEnviar className="min-h-14 text-[1.25rem]">{rotuloBotao ?? (info.planejada ? 'Marcar a data' : 'Marcar como feita')}</BotaoEnviar>
    </form>
  )
}

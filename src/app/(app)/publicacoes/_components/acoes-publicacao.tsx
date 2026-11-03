'use client'

import Link from 'next/link'
import { useActionState, useState } from 'react'
import { BotaoEnviar } from '@/components/ui/botao-enviar'
import { Botao, Entrada, MensagemFormulario, Selecao, classeBotao } from '@/components/ui/form'
import { MOTIVOS_PARA_IGNORAR } from '@/domain/publicacoes'
import { ignorarAto, lancarAto } from '../actions'

/**
 * Ações na linha do ato: lançar no processo (ou marcar como visto, se a série não vira etapa) ou ignorar com motivo.
 * Sem processo cadastrado, o caminho é cadastrar a partir do ato; o cadastro já lança.
 */
export function AcoesPublicacao({ id, temProcesso, marcaEtapa }: { id: string; temProcesso: boolean; marcaEtapa: boolean }) {
  const [lancamento, lancar] = useActionState(lancarAto, {})
  const [ignorado, ignorar] = useActionState(ignorarAto, {})
  const [ignorando, setIgnorando] = useState(false)
  const [motivo, setMotivo] = useState('')
  const erroMotivo = ignorado.erros?.motivo ?? ignorado.erros?.outro

  if (ignorando) {
    return (
      <form action={ignorar} className="w-64 space-y-2">
        <input type="hidden" name="id" value={id} />
        <Selecao name="motivo" value={motivo} onChange={(e) => setMotivo(e.target.value)} aria-label="Por que ignorar?" required autoFocus>
          <option value="" disabled>
            Por que ignorar?
          </option>
          {MOTIVOS_PARA_IGNORAR.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
          <option value="outro">Outro (escrever)</option>
        </Selecao>
        {motivo === 'outro' && <Entrada name="outro" defaultValue={ignorado.valores?.outro} aria-label="Motivo" placeholder="Escreva o motivo" required autoFocus />}
        {erroMotivo && <p className="text-xs text-danger">{erroMotivo}</p>}
        <div className="flex justify-end gap-2">
          <Botao type="button" variante="secundario" onClick={() => setIgnorando(false)}>
            Voltar
          </Botao>
          <BotaoEnviar>Ignorar</BotaoEnviar>
        </div>
      </form>
    )
  }

  return (
    <div className="flex flex-col items-start gap-1.5 sm:items-end">
      <div className="flex flex-wrap gap-2 sm:justify-end">
        {temProcesso ? (
          <form action={lancar}>
            <input type="hidden" name="id" value={id} />
            <BotaoEnviar>{marcaEtapa ? 'Lançar no processo' : 'Marcar como visto'}</BotaoEnviar>
          </form>
        ) : (
          <Link href={`/processos/novo?ato=${encodeURIComponent(id)}`} className={classeBotao()}>
            {marcaEtapa ? 'Cadastrar o processo e lançar' : 'Cadastrar o processo'}
          </Link>
        )}
        <Botao variante="secundario" onClick={() => setIgnorando(true)}>
          Ignorar
        </Botao>
      </div>
      <MensagemFormulario estado={lancamento} />
    </div>
  )
}

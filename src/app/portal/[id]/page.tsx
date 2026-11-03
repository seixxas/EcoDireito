import { Check } from 'lucide-react'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import type { Tom } from '@/components/ui/badge'
import { Secao } from '@/components/ui/secao'
import { Situacao } from '@/components/ui/situacao'
import { hoje } from '@/data/hoje'
import { obterProcesso } from '@/data/processos'
import { exigirUsuario } from '@/data/sessao'
import { pode } from '@/lib/permissoes'
import { proximoPrazo } from '@/domain/prazos'
import { FASES } from '@/domain/processos'
import { cn } from '@/lib/cn'
import { diasEntre } from '@/lib/datas'
import { formatarData } from '@/lib/formatar'
import { TopoDoPortal } from '../_components/topo'

export const metadata: Metadata = { title: 'Acompanhamento do processo' }

function contagem(dias: number): { texto: string; tom: Tom } {
  if (dias < 0) return { texto: `venceu há ${-dias} ${dias === -1 ? 'dia' : 'dias'}`, tom: 'danger' }
  if (dias === 0) return { texto: 'vence hoje', tom: 'danger' }
  if (dias === 1) return { texto: 'vence amanhã', tom: 'warn' }
  return { texto: `faltam ${dias} dias`, tom: dias <= 10 ? 'warn' : 'ok' }
}

/** O que a construtora vê: só leitura, a fase do processo e o próximo prazo. */
export default async function Portal({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const [usuario, dia, dados] = await Promise.all([exigirUsuario(), hoje(), obterProcesso(id)])
  // A construtora só vê os próprios processos; quem acompanha prazos vê todos (para conferir a visão do cliente).
  const podeVer = usuario.papel === 'cliente' ? usuario.clienteId === dados?.processo.clienteId : pode(usuario.papel, 'prazos')
  if (!dados || !podeVer) notFound()
  const { processo, prazos } = dados
  const fase = FASES[processo.faseAtual - 1]
  const proximo = proximoPrazo(prazos, dia)
  const conta = proximo && contagem(diasEntre(dia, proximo.vencimento))

  return (
    <>
      <TopoDoPortal comSair={usuario.papel === 'cliente'} />
      <main className="mx-auto max-w-3xl px-5 py-10">
        <p className="text-sm text-muted">Acompanhamento do licenciamento ambiental</p>
        <h1 className="mt-1 font-display text-[1.75rem] font-semibold leading-tight text-ink">{processo.empreendimento}</h1>
        <p className="text-muted">{processo.endereco}</p>

        <div className="mt-6 rounded-lg border border-line bg-surface p-5">
          <p className="text-sm text-muted">
            Fase {fase.numero} de {FASES.length}
          </p>
          <p className="text-lg font-semibold text-ink">{fase.nome}</p>
          <div className="mt-3 flex gap-1">
            {FASES.map((f) => (
              <span
                key={f.numero}
                className={cn('h-1.5 flex-1 rounded-full', f.numero < fase.numero ? 'bg-ok' : f.numero === fase.numero ? 'bg-accent' : 'bg-line')}
              />
            ))}
          </div>
          {proximo && conta && (
            <div className="mt-4 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-t border-line pt-4">
              <p>
                <span className="text-muted">Próximo prazo: </span>
                <span className="font-medium text-ink">{proximo.regra.titulo}</span>
              </p>
              <p className="flex items-center gap-3">
                <span className="tabular-nums text-ink">{formatarData(proximo.vencimento)}</span>
                <Situacao tom={conta.tom}>{conta.texto}</Situacao>
              </p>
            </div>
          )}
        </div>

        <Secao titulo="As etapas do processo">
          <ol>
            {FASES.map((f, i) => {
              const estado = f.numero < fase.numero ? 'feita' : f.numero === fase.numero ? 'atual' : 'futura'
              return (
                <li key={f.numero} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <span
                      className={cn(
                        'flex size-7 shrink-0 items-center justify-center rounded-full text-sm font-semibold',
                        estado === 'feita' && 'bg-ok text-white',
                        estado === 'atual' && 'bg-brand-700 text-white ring-4 ring-brand-100',
                        estado === 'futura' && 'bg-surface text-subtle ring-1 ring-line',
                      )}
                    >
                      {estado === 'feita' ? <Check className="size-4" /> : f.numero}
                    </span>
                    {i < FASES.length - 1 && <span className={cn('my-1 w-px flex-1', estado === 'feita' ? 'bg-ok' : 'bg-line')} />}
                  </div>
                  <div className="pb-5 pt-0.5">
                    <p className={cn('font-medium', estado === 'futura' ? 'text-muted' : 'text-ink')}>{f.nome}</p>
                    {estado === 'atual' ? (
                      <p className="mt-0.5 text-sm text-muted">{f.descricao}</p>
                    ) : (
                      <p className="text-xs text-subtle">{estado === 'feita' ? 'Concluída' : 'A iniciar'}</p>
                    )}
                  </div>
                </li>
              )
            })}
          </ol>
        </Secao>

        <p className="mt-8 text-xs text-subtle">Eco Direito Ambiental · sistema desenvolvido pela Awer</p>
      </main>
    </>
  )
}

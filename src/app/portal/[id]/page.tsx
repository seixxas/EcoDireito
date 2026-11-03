import { CalendarClock, Check, Leaf, LogOut, TriangleAlert } from 'lucide-react'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { sair } from '@/app/(auth)/actions'
import { hoje } from '@/data/hoje'
import { obterProcesso } from '@/data/processos'
import { exigirUsuario } from '@/data/sessao'
import { pode } from '@/lib/permissoes'
import { proximoPrazo } from '@/domain/prazos'
import { FASES } from '@/domain/processos'
import { cn } from '@/lib/cn'
import { diasEntre } from '@/lib/datas'
import { formatarData } from '@/lib/formatar'

export const metadata: Metadata = { title: 'Acompanhamento do processo' }

function contagem(dias: number) {
  if (dias < 0) return { texto: `venceu há ${-dias} ${dias === -1 ? 'dia' : 'dias'}`, cor: 'text-danger' }
  if (dias === 0) return { texto: 'vence hoje', cor: 'text-danger' }
  if (dias === 1) return { texto: 'vence amanhã', cor: 'text-warn' }
  return { texto: `faltam ${dias} dias`, cor: dias <= 10 ? 'text-warn' : 'text-ok' }
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
    <div className="pb-12">
      <header className="bg-gradient-to-r from-brand-700 to-brand-500 pb-12 text-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
          <span className="flex items-center gap-2 font-display text-lg font-semibold">
            <Leaf className="size-5" /> eco direito
          </span>
          <span className="flex items-center gap-4 text-sm text-brand-100">
            por awer.co
            {usuario.papel === 'cliente' && (
              <form action={sair}>
                <button className="flex items-center gap-1.5 rounded-lg px-2 py-1 hover:bg-white/10">
                  <LogOut className="size-4" /> Sair
                </button>
              </form>
            )}
          </span>
        </div>
        <div className="mx-auto max-w-6xl px-5 pt-6">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-brand-100">Eco Direito Ambiental · Acompanhamento de processo</p>
          <h1 className="mt-1 font-display text-3xl font-semibold">As 7 etapas do seu processo</h1>
          <p className="mt-1 text-brand-100">Cada projeto percorre 7 fases. Acompanhe aqui o andamento e as datas-limite.</p>
        </div>
      </header>

      <main className="mx-auto -mt-8 max-w-6xl px-5">
        <div className="flex flex-wrap items-center justify-between gap-5 rounded-2xl border border-line bg-surface px-6 py-5 shadow-sm">
          <div>
            <p className="font-display text-xl font-semibold text-brand-700">{processo.empreendimento}</p>
            <p className="text-sm text-muted">{processo.endereco}</p>
          </div>
          <div className="min-w-64 flex-1">
            <p className="text-sm font-semibold text-muted">
              Fase {fase.numero} de 7 · {fase.nome}
            </p>
            <div className="mt-1.5 flex gap-1">
              {FASES.map((f) => (
                <span key={f.numero} className={cn('h-2.5 flex-1 rounded', f.numero < fase.numero ? 'bg-ok' : f.numero === fase.numero ? 'bg-accent' : 'bg-line')} />
              ))}
            </div>
          </div>
          <span className="rounded-full border border-accent/50 bg-warn-soft px-4 py-1.5 text-sm font-semibold text-warn">Em andamento</span>
        </div>

        {proximo && conta && (
          <div className="mt-4 flex items-center gap-3 rounded-xl border border-accent/50 bg-warn-soft px-5 py-3.5 text-sm text-warn">
            <TriangleAlert className="size-5 shrink-0" />
            <p>
              <strong>Atenção ao prazo:</strong> {proximo.regra.titulo.toLowerCase()} até <strong>{formatarData(proximo.vencimento)}</strong> ({conta.texto}).
            </p>
          </div>
        )}

        <ol className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
          {FASES.map((f) => {
            const estado = f.numero < fase.numero ? 'feita' : f.numero === fase.numero ? 'atual' : 'futura'
            return (
              <li
                key={f.numero}
                className={cn(
                  'flex flex-col rounded-xl border border-line border-t-4 bg-surface p-4',
                  estado === 'feita' && 'border-t-ok',
                  estado === 'atual' && 'border-t-accent shadow-md',
                  estado === 'futura' && 'border-t-subtle',
                )}
              >
                <div className="mb-2 flex items-center justify-between">
                  <span
                    className={cn(
                      'flex size-8 items-center justify-center rounded-full text-sm font-bold',
                      estado === 'feita' && 'bg-ok text-white',
                      estado === 'atual' && 'bg-accent text-white',
                      estado === 'futura' && 'bg-canvas text-muted ring-1 ring-line',
                    )}
                  >
                    {estado === 'feita' ? <Check className="size-4" /> : f.numero}
                  </span>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-subtle">Fase {f.numero}</span>
                </div>
                <p className="font-semibold leading-tight">{f.nome}</p>
                <p className="mt-1 flex-1 text-xs text-muted">{f.descricao}</p>
                <div className="mt-3 border-t border-dashed border-line pt-2.5 text-sm">
                  {estado === 'feita' && <p className="font-semibold text-ok">Concluída</p>}
                  {estado === 'futura' && <p className="text-subtle">A iniciar</p>}
                  {estado === 'atual' &&
                    (proximo && conta ? (
                      <>
                        <p className="text-[10px] font-semibold uppercase tracking-wide text-subtle">Próximo prazo</p>
                        <p className="flex items-center gap-1.5 font-semibold">
                          <CalendarClock className="size-4 text-warn" /> {formatarData(proximo.vencimento)}
                        </p>
                        <p className={cn('text-xs font-semibold', conta.cor)}>{conta.texto}</p>
                      </>
                    ) : (
                      <p className="font-semibold text-warn">Em andamento</p>
                    ))}
                </div>
              </li>
            )
          })}
        </ol>

        <p className="mt-8 text-center text-xs text-subtle">
          <strong className="text-brand-700">Eco Direito Ambiental</strong> · Painel elaborado por <strong className="text-brand-700">Awer Consultoria</strong>
        </p>
      </main>
    </div>
  )
}

import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { TrilhaDeFases } from '@/components/processos/trilha-de-fases'
import type { Tom } from '@/components/ui/badge'
import { Situacao } from '@/components/ui/situacao'
import { hoje } from '@/data/hoje'
import { obterProcesso } from '@/data/processos'
import { exigirUsuario } from '@/data/sessao'
import { pode } from '@/lib/permissoes'
import { proximoPrazo } from '@/domain/prazos'
import { conclusaoDaFase, FASES, type NumeroFase } from '@/domain/processos'
import { diasEntre } from '@/lib/datas'
import { formatarData } from '@/lib/formatar'
import { PaginaDoPortal } from '../_components/topo'

export const metadata: Metadata = { title: 'Acompanhamento do projeto' }

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
  const concluida = (numero: NumeroFase) => {
    const data = conclusaoDaFase(processo, numero, dia)
    return data ? `Concluída em ${formatarData(data)}` : 'Concluída'
  }

  return (
    <PaginaDoPortal comSair={usuario.papel === 'cliente'}>
      <p className="font-medium text-brand-700">Seu projeto</p>
      <h1 className="mt-1 text-3xl font-semibold lg:text-4xl">{processo.empreendimento}</h1>
      <p className="mt-2 text-muted">{processo.endereco}</p>

      <section className="mt-10 rounded-xl bg-brand-50 p-5 sm:p-7">
        <p className="text-base font-semibold text-subtle">Fase atual</p>
        <h2 className="mt-0.5 text-[1.75rem] font-semibold leading-tight text-brand-700 sm:text-[2.25rem]">
          {fase.numero} de {FASES.length} — {fase.nome}
        </h2>
        <p className="mt-2">{fase.descricao}</p>
        <div className="mt-6">
          <TrilhaDeFases
            fases={FASES.map((f) => {
              const estado = f.numero < fase.numero ? 'feita' : f.numero === fase.numero ? 'atual' : 'futura'
              return { numero: f.numero, nome: f.nome, estado, legenda: estado === 'feita' ? concluida(f.numero) : undefined }
            })}
          />
        </div>
      </section>

      <div className="mt-6 grid gap-6 md:grid-cols-2">
        {proximo && conta && (
          <section className="rounded-xl bg-painel px-5 py-6.5 sm:px-7">
            <p className="text-base font-semibold text-subtle">Próximo prazo</p>
            <p className="mt-1 text-[2.5rem] font-semibold leading-tight">{formatarData(proximo.vencimento)}</p>
            <Situacao tom={conta.tom} className="mt-1 text-base!">
              {conta.texto}
            </Situacao>
            <p className="mt-3">{proximo.regra.titulo}</p>
          </section>
        )}
        <section className="rounded-xl bg-painel px-5 py-6.5 sm:px-7">
          <p className="text-base font-semibold text-subtle">Quem cuida do seu projeto</p>
          <p className="mt-1 text-[2rem] font-semibold leading-tight">{processo.responsavel}</p>
          <p className="mt-1 font-medium text-muted">Eco Direito</p>
        </section>
      </div>

      {processo.numeroSei && (
        <dl className="mt-8">
          <div className="flex flex-wrap justify-between gap-x-4 gap-y-1 border-b border-line py-4">
            <dt className="font-medium">Processo na Prefeitura</dt>
            <dd>SEI {processo.numeroSei}</dd>
          </div>
        </dl>
      )}

      <p className="mt-8 text-xs text-subtle">Eco Direito Ambiental · sistema desenvolvido pela Awer</p>
    </PaginaDoPortal>
  )
}

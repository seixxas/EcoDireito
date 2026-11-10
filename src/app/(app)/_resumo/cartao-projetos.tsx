import { Icone, type NomeIcone } from '@/components/ui/icone'
import { LinkRapido } from '@/components/ui/link-rapido'
import { listarProcessos } from '@/data/processos'
import { FASES, situacaoDaFase, type NumeroFase } from '@/domain/processos'
import type { DataISO } from '@/lib/datas'
import { cn } from '@/lib/cn'
import { contar } from '@/lib/formatar'
import { CartaoResumo, Destaque } from './cartao'

const ICONE_DA_FASE: Record<NumeroFase, NomeIcone> = {
  1: 'request_quote',
  2: 'folder_open',
  3: 'search',
  4: 'reply',
  5: 'handshake',
  6: 'forest',
  7: 'construction',
  8: 'eco',
}

/** Cartão do Resumo: quantos projetos estão andando e em que fase cada um está. */
export async function CartaoProjetos({ dia }: { dia: DataISO }) {
  const itens = await listarProcessos()
  // Encerrado = última fase com a etapa final feita (certificado definitivo); não está mais em andamento.
  const emAndamento = itens.filter(({ processo }) => situacaoDaFase(processo, FASES.length, dia) !== 'concluida')
  const porFase = FASES.map((fase) => ({ fase, quantidade: emAndamento.filter(({ processo }) => processo.faseAtual === fase.numero).length }))
  const maior = Math.max(1, ...porFase.map((f) => f.quantidade))

  return (
    <CartaoResumo icone="folder" titulo="Projetos" href="/projetos">
      <Destaque icone="autorenew" rotulo="Em andamento" valor={contar(emAndamento.length, 'projeto', 'projetos')} />
      <ul className="flex flex-col gap-[3px]">
        {porFase.map(({ fase, quantidade }) => (
          <li key={fase.numero}>
            <LinkRapido
              href={`/projetos?fase=${fase.numero}`}
              className="grid grid-cols-[7.625rem_minmax(0,1fr)_1.125rem] items-center gap-2 rounded-md py-0.5 text-[0.78125rem] hover:bg-brand-50"
            >
              <span className="flex min-w-0 items-center gap-1.5 text-ink/80">
                <Icone nome={ICONE_DA_FASE[fase.numero]} className={cn('text-base', quantidade ? 'text-brand-700' : 'text-ink/30')} />
                {/* Só a primeira palavra ("Compromisso"), como no filtro da lista de projetos. */}
                <span className="truncate">{fase.nome.split(' ')[0]}</span>
              </span>
              <span className="h-3 overflow-hidden rounded bg-brand-50">
                <span className="block h-full rounded bg-brand-500" style={{ width: `${(quantidade / maior) * 100}%` }} />
              </span>
              <span className={cn('text-right font-semibold', quantidade ? 'text-ink' : 'text-ink/30')}>{quantidade}</span>
            </LinkRapido>
          </li>
        ))}
      </ul>
    </CartaoResumo>
  )
}

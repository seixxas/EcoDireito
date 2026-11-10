import { LinkRapido } from '@/components/ui/link-rapido'
import { BotaoNovo } from './botao-novo'
import { BuscaGeral } from './busca-geral'
import { MenuDaConta } from './menu-da-conta'
import type { UsuarioDoMenu } from './menu-lateral'

/** Aviso vermelho do topo: quantos prazos já venceram. Leva para a lista de prazos. */
function AvisoDeVencidos({ quantidade }: { quantidade: number }) {
  return (
    <LinkRapido
      href="/prazos"
      className="hidden h-8 shrink-0 items-center gap-2 rounded-full bg-danger-soft px-3 text-sm font-semibold text-danger ring-1 ring-danger-fio hover:bg-danger-fio/60 sm:inline-flex"
    >
      <span className="size-2 rounded-full bg-danger" aria-hidden />
      {quantidade === 1 ? '1 prazo vencido' : `${quantidade} prazos vencidos`}
    </LinkRapido>
  )
}

/** Barra branca do topo (desenho 3a): busca, aviso de vencidos, Novo e (no celular) a conta. Sem usuário, só a busca apagada. */
export function Topo({ usuario, vencidos = 0 }: { usuario?: UsuarioDoMenu; vencidos?: number }) {
  return (
    <header className="sticky top-0 z-30 flex h-[60px] items-center gap-3 border-b border-line bg-surface px-3 lg:px-8 print:hidden">
      <div className="min-w-0 flex-1 sm:max-w-[440px]">{usuario && <BuscaGeral />}</div>
      {vencidos > 0 && <AvisoDeVencidos quantidade={vencidos} />}
      <span className="hidden flex-1 sm:block" />
      {usuario && (
        <>
          <BotaoNovo papel={usuario.papel} />
          {/* Na tela grande, conta, tema e sair ficam no pé do menu lateral. */}
          <div className="lg:hidden">
            <MenuDaConta usuario={usuario} />
          </div>
        </>
      )}
    </header>
  )
}

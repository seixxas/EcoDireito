import { Leaf, LogOut } from 'lucide-react'
import { sair } from '@/app/(auth)/actions'

/** Barra do portal do cliente. `comSair` só para o cliente (a equipe vê o portal para conferir). */
export function TopoDoPortal({ comSair }: { comSair: boolean }) {
  return (
    <header className="border-b border-line bg-rail">
      <div className="mx-auto flex max-w-3xl items-center justify-between px-5 py-3">
        <span className="flex items-center gap-2">
          <span className="flex size-7 items-center justify-center rounded-md bg-brand-700 text-white">
            <Leaf className="size-4" />
          </span>
          <span className="font-display text-lg font-semibold text-ink">Eco Direito</span>
        </span>
        {comSair && (
          <form action={sair}>
            <button className="flex items-center gap-1.5 text-sm text-muted hover:text-ink">
              <LogOut className="size-4" /> Sair
            </button>
          </form>
        )}
      </div>
    </header>
  )
}

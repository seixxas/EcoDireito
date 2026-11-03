import { Trash2 } from 'lucide-react'
import type { Metadata } from 'next'
import { Card } from '@/components/ui/card'
import { Expansivel, Vazio } from '@/components/ui/expansivel'
import { Linha, Lista } from '@/components/ui/lista'
import { PageHeader } from '@/components/ui/page-header'
import { Paginacao } from '@/components/ui/paginacao'
import { carregar } from '@/data/base'
import { exigirArea } from '@/data/sessao'
import { listarUsuarios } from '@/data/usuarios'
import { contar, juntar } from '@/lib/formatar'
import { paginar } from '@/lib/paginar'
import { PAPEIS, type Papel } from '@/lib/permissoes'
import { excluirUsuario } from './actions'
import { FormularioUsuario } from './_components/formulario-usuario'

export const metadata: Metadata = { title: 'Usuários' }

/** "edita prazos e financeiro e cuida dos acessos", em vez de uma tabela de permissões. */
function oQuePode(papel: Papel) {
  if (papel === 'cliente') return 'vê só o portal dos próprios processos'
  const { prazos, financeiro, usuarios } = PAPEIS[papel]
  const partes = [
    prazos !== 'nada' && `${prazos === 'editar' ? 'edita' : 'vê'} prazos`,
    financeiro !== 'nada' && `${financeiro === 'editar' ? 'edita' : 'vê'} o financeiro`,
    usuarios === 'editar' && 'cuida dos acessos',
  ].filter((parte): parte is string => Boolean(parte))
  return juntar(partes)
}

export default async function PaginaUsuarios({ searchParams }: { searchParams: Promise<{ pagina?: string }> }) {
  const [eu, usuarios, { clientes }, busca] = await Promise.all([exigirArea('usuarios'), listarUsuarios(), carregar(), searchParams])
  const pagina = paginar(usuarios, busca.pagina)

  return (
    <>
      <PageHeader titulo="Usuários" resumo={`${contar(usuarios.length, 'pessoa tem', 'pessoas têm')} acesso. Cada perfil vê só a sua parte.`} />

      <Lista>
        {pagina.itens.map((usuario) => (
          <Linha key={usuario.id}>
            <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-brand-50 text-sm font-semibold text-brand-700">
              {usuario.nome.at(0)}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate font-medium text-ink">
                {usuario.nome}
                {usuario.id === eu.id && <span className="ml-2 text-xs font-normal text-subtle">você</span>}
              </span>
              <span className="block truncate text-xs text-muted">{usuario.email}</span>
            </span>
            <span className="hidden min-w-0 flex-1 sm:block">
              <span className="block text-sm text-ink">
                {PAPEIS[usuario.papel].nome}
                {usuario.cliente && <span className="text-muted"> · {usuario.cliente}</span>}
              </span>
              <span className="block text-xs text-muted">{oQuePode(usuario.papel)}</span>
            </span>
            <span className="w-8 shrink-0">
              {usuario.id !== eu.id && (
                <form action={excluirUsuario}>
                  <input type="hidden" name="id" value={usuario.id} />
                  <button title="Remover acesso" className="rounded-md p-1.5 text-subtle hover:bg-danger-soft hover:text-danger">
                    <Trash2 className="size-4" />
                  </button>
                </form>
              )}
            </span>
          </Linha>
        ))}
      </Lista>
      <Paginacao {...pagina} href={(n) => `/usuarios?pagina=${n}`} />
      {usuarios.length === 0 && <Vazio>Sem banco configurado: os usuários aparecem aqui quando o Neon estiver ligado.</Vazio>}

      <Expansivel resumo="Dar acesso a outra pessoa" className="mt-5">
        <Card className="max-w-3xl">
          <FormularioUsuario clientes={clientes} />
        </Card>
      </Expansivel>
    </>
  )
}

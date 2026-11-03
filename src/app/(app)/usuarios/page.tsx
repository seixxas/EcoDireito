import { Trash2 } from 'lucide-react'
import type { Metadata } from 'next'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { PageHeader } from '@/components/ui/page-header'
import { carregar } from '@/data/base'
import { exigirArea } from '@/data/sessao'
import { listarUsuarios } from '@/data/usuarios'
import { PAPEIS, type Papel } from '@/lib/permissoes'
import { excluirUsuario } from './actions'
import { FormularioUsuario } from './_components/formulario-usuario'

export const metadata: Metadata = { title: 'Usuários' }

const TOM: Record<Papel, 'brand' | 'info' | 'neutral' | 'warn'> = { socia: 'brand', financeiro: 'info', equipe: 'neutral', contador: 'info', cliente: 'warn' }

export default async function PaginaUsuarios() {
  const [eu, usuarios, { clientes }] = await Promise.all([exigirArea('usuarios'), listarUsuarios(), carregar()])

  return (
    <>
      <PageHeader titulo="Usuários" descricao="Quem entra no sistema e o que cada perfil vê. Cliente entra só no portal, nos processos dele." />

      <Card titulo="Novo acesso" className="mb-6">
        <FormularioUsuario clientes={clientes} />
      </Card>

      <Card titulo="Acessos" flush>
        <table className="tabela">
          <thead>
            <tr>
              <th>Nome</th>
              <th>E-mail</th>
              <th>Perfil</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {usuarios.map((usuario) => (
              <tr key={usuario.id}>
                <td className="font-medium">{usuario.nome}</td>
                <td className="text-muted">{usuario.email}</td>
                <td>
                  <Badge tom={TOM[usuario.papel]}>{PAPEIS[usuario.papel].nome}</Badge>
                  {usuario.cliente && <span className="ml-2 text-xs text-muted">{usuario.cliente}</span>}
                </td>
                <td className="text-right">
                  {usuario.id !== eu.id && (
                    <form action={excluirUsuario}>
                      <input type="hidden" name="id" value={usuario.id} />
                      <button title="Remover acesso" className="rounded-lg p-2 text-subtle hover:bg-danger-soft hover:text-danger">
                        <Trash2 className="size-4" />
                      </button>
                    </form>
                  )}
                </td>
              </tr>
            ))}
            {usuarios.length === 0 && (
              <tr>
                <td colSpan={4} className="py-8 text-center text-muted">
                  Sem banco configurado: os usuários aparecem aqui quando o Neon estiver ligado.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Card>
    </>
  )
}

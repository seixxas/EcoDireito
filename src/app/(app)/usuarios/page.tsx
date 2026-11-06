import type { Metadata } from 'next'
import { BotaoConfirmar } from '@/components/ui/botao-confirmar'
import { Card } from '@/components/ui/card'
import { Vazio } from '@/components/ui/expansivel'
import { classeBotao } from '@/components/ui/form'
import { LinkRapido } from '@/components/ui/link-rapido'
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

const COLUNAS = 'xl:grid xl:grid-cols-[minmax(0,0.8fr)_minmax(0,1.6fr)_minmax(0,1.1fr)_5rem] xl:gap-x-3'

/** "edita prazos e financeiro e cuida dos acessos", em vez de uma tabela de permissões. */
function oQuePode(papel: Papel) {
  if (papel === 'cliente') return 'vê só o portal dos próprios projetos'
  const { prazos, financeiro, usuarios } = PAPEIS[papel]
  const partes = [
    prazos !== 'nada' && `${prazos === 'editar' ? 'edita' : 'vê'} prazos`,
    financeiro !== 'nada' && `${financeiro === 'editar' ? 'edita' : 'vê'} o financeiro`,
    usuarios === 'editar' && 'cuida dos acessos',
  ].filter((parte): parte is string => Boolean(parte))
  return juntar(partes)
}

export default async function PaginaUsuarios({ searchParams }: { searchParams: Promise<{ pagina?: string; novo?: string }> }) {
  const [eu, usuarios, { clientes }, busca] = await Promise.all([exigirArea('usuarios'), listarUsuarios(), carregar(), searchParams])
  const pagina = paginar(usuarios, busca.pagina)
  const criando = busca.novo !== undefined

  return (
    <>
      <PageHeader
        titulo="Usuários"
        resumo={`${contar(usuarios.length, 'pessoa tem', 'pessoas têm')} acesso. Cada perfil vê só a sua parte.`}
        acoes={
          <LinkRapido href={criando ? '/usuarios' : '/usuarios?novo=1'} className={classeBotao(criando ? 'secundario' : 'primario')}>
            {criando ? 'Fechar' : '+ Novo usuário'}
          </LinkRapido>
        }
      />

      {criando && (
        <Card titulo="Dar acesso a outra pessoa" className="mb-4">
          <FormularioUsuario clientes={clientes} />
        </Card>
      )}

      {usuarios.length > 0 && (
        <Lista>
          <li aria-hidden className={`hidden px-3 py-1.5 text-xs font-medium text-subtle ${COLUNAS}`}>
            <span>Nome</span>
            <span>Perfil</span>
            <span>E-mail</span>
          </li>
          {pagina.itens.map((usuario) => (
            <Linha key={usuario.id} className={COLUNAS}>
              <div className="flex min-w-0 flex-1 basis-72 flex-col xl:contents">
                <p className="min-w-0 text-sm font-semibold leading-snug wrap-anywhere">
                  {usuario.nome}
                  {usuario.id === eu.id && <small className="ml-1.5 text-2xs font-medium text-brand-700">você</small>}
                </p>
                <div className="min-w-0">
                  <p>
                    {PAPEIS[usuario.papel].nome}
                    {usuario.cliente && <span className="text-muted"> · {usuario.cliente}</span>}
                  </p>
                  <p className="text-xs text-muted">{oQuePode(usuario.papel)}</p>
                </div>
                <p className="min-w-0 text-subtle wrap-anywhere">{usuario.email}</p>
              </div>
              {usuario.id !== eu.id && (
                <form action={excluirUsuario} className="xl:justify-self-end">
                  <input type="hidden" name="id" value={usuario.id} />
                  <BotaoConfirmar
                    variante="secundario"
                    tamanho="pequeno"
                    titulo={`Remover o acesso de ${usuario.nome}?`}
                    oQue={<span className="wrap-anywhere">{usuario.email}</span>}
                    consequencia="A pessoa não vai mais conseguir entrar no sistema."
                    sim="Sim, remover o acesso"
                  >
                    Remover
                  </BotaoConfirmar>
                </form>
              )}
            </Linha>
          ))}
        </Lista>
      )}
      <Paginacao {...pagina} href={(n) => `/usuarios?pagina=${n}`} />
      {usuarios.length === 0 && <Vazio>Sem banco configurado: os usuários aparecem aqui quando o Neon estiver ligado.</Vazio>}
    </>
  )
}

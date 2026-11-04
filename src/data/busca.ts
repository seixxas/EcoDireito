import { propostaRecusada } from '@/domain/propostas'
import { combina } from '@/lib/buscar'
import { pode } from '@/lib/permissoes'
import { carregar } from './base'

/** A busca geral. Cada perfil só acha o que pode abrir: as notas já vêm cortadas pelo `carregar()`. */
export async function buscarTudo(q: string) {
  const { usuario, clientes, processos, financeiro } = await carregar()
  const verProcessos = pode(usuario.papel, 'prazos')
  const clienteDe = (id: string) => clientes.find((c) => c.id === id)

  return {
    clientes: verProcessos ? clientes.filter((c) => combina(q, c.nome, c.documento, c.documento.replace(/\D/g, ''), c.grupo)) : [],
    processos: verProcessos
      ? processos.flatMap((processo) => {
          const cliente = clienteDe(processo.clienteId)
          const achou =
            cliente &&
            combina(q, processo.empreendimento, processo.endereco, processo.numeroSei, processo.numeroSimproc, processo.numeroTca, processo.responsavel, cliente.nome, cliente.grupo)
          return achou ? [{ processo, cliente, recusada: propostaRecusada(processo) }] : []
        })
      : [],
    notas: financeiro.notas
      .flatMap((nota) => {
        const cliente = clienteDe(nota.clienteId)
        return cliente && combina(q, nota.numero, nota.descricao, cliente.nome, cliente.grupo) ? [{ nota, cliente }] : []
      })
      .sort((a, b) => b.nota.numero - a.nota.numero),
  }
}

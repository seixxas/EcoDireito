import { cacheLife, cacheTag, refresh, updateTag } from 'next/cache'

/** Por quantos segundos o navegador reaproveita uma tela. O que outra pessoa gravou aparece depois desse tempo, ou com F5. */
const SEGUNDOS_NA_TELA = 60

const ETIQUETA = 'dados'

/**
 * Chame logo depois de `'use cache: private'`, nas leituras das telas. Esse modo guarda a tela pronta só no navegador
 * de quem pediu: no servidor nada fica salvo, cada leitura vai ao banco, e é isso que deixa a tela ser preparada antes do clique.
 */
export function guardarNaTela() {
  cacheLife({ stale: SEGUNDOS_NA_TELA })
  cacheTag(ETIQUETA)
}

/**
 * Toda Server Action que grava chama esta função depois de gravar, também antes de um `redirect`.
 * `refresh` limpa as telas guardadas no navegador. `updateTag` é o que faz a tela refeita nesta mesma resposta
 * ler o banco de novo: sem ele, o Next reaproveita a leitura feita antes de gravar, e quem salvou veria o dado antigo.
 */
export function atualizarTelas() {
  updateTag(ETIQUETA)
  refresh()
}

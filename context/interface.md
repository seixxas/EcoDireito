# Interface (redesign de 03/11)

Objetivo: uma ferramenta de trabalho, não um "dashboard". Fácil de ler, pouco scroll e o mais importante primeiro.
Quem usa são as sócias e a equipe da Eco Direito, todo dia, para saber **o que fazer agora**.

## Princípios

1. **Uma pergunta por tela.** O topo responde a pergunta da tela numa frase ("1 prazo vencido e 8 nesta semana"). Nada de fileira de cartões de KPI.
2. **Lista antes de cartão.** Conteúdo em linhas separadas por fio fino, dentro de uma `Secao`. Caixa (`Card`) só para formulário ou bloco que precisa se destacar.
3. **Menos scroll.**
   - Mostre o recorte útil (mês atual, próximos 30 dias, os 10 primeiros) e deixe o resto atrás de "ver todos" ou de um filtro.
   - Detalhe longo (texto do ato, cálculo do prazo, movimentos) fica recolhido em `Expansivel`.
   - Página com várias partes usa abas (`Abas`), não seções empilhadas.
4. **Status discreto.** Situação é ponto colorido + texto (`Situacao`). Pílula colorida (`Badge`) só para etiqueta neutra (tipo, origem). Vermelho só para o que está vencido ou atrasado.
5. **Texto de gente.** Títulos curtos, rótulos em minúsculas normais (nada de CAIXA ALTA com espaçamento), números alinhados à direita. Ajuda longa vira uma frase ou some.
6. **Ícone só quando ajuda a achar.** Menu e ações principais. Não decore título nem número.

## Identidade

- Fundo papel (`canvas`), conteúdo em branco só quando agrupa. Verde da marca em detalhes (menu ativo, botão principal, links). Âmbar (`accent`) só para "atenção".
- Fontes: Bricolage Grotesque só no título da página (`font-display`); todo o resto em IBM Plex Sans.
- Tamanho base 15 px (`text-sm` foi ajustado para 15 px e `text-xs` para 13 px em `globals.css`).
- Cantos `rounded-lg` (caixas) e `rounded-md` (botões, campos). Sem sombra, a não ser em menu suspenso.

| Token | Uso |
|---|---|
| `canvas` / `surface` / `line` | fundo, superfície, fios |
| `ink` / `muted` / `subtle` | texto principal, secundário, terciário |
| `brand-50` a `brand-900` | marca |
| `ok`, `warn`, `danger`, `info` (+ `-soft`) | situação |
| `accent` | atenção (âmbar) |

## Layout

- Menu lateral claro, estreito, com os grupos Prazos, Financeiro e Administração. Usuário e "Sair" no pé.
- Área de conteúdo com `max-w-6xl`. Tabela larga pode usar a largura toda.
- `PageHeader`: título + frase-resumo (`resumo`) + ações à direita. A `descricao` longa sai; se for essencial, use uma frase curta.

## Componentes (`src/components/ui`)

| Componente | Para quê |
|---|---|
| `PageHeader({ titulo, resumo?, acoes? })` | Topo da página. `resumo` é a frase que responde a pergunta da tela |
| `Resumo` + `ItemResumo({ rotulo, valor, detalhe?, tom? })` | Até 4 números numa faixa única, sem cartões |
| `Secao({ titulo, acao?, children })` | Bloco de conteúdo sem caixa: título pequeno e conteúdo |
| `Lista` / `Linha({ href?, children })` | Lista de linhas com fio; com `href`, a linha inteira é link |
| `Situacao({ tom, children })` | Status: ponto + texto |
| `Badge({ tom })` | Etiqueta neutra (tipo, origem) |
| `Abas({ abas, ativa })` | Abas por URL (`?aba=`), sublinhadas |
| `SegmentedLinks` | Filtros por URL (mesmo visual das abas) |
| `Expansivel({ resumo, children })` | Conteúdo recolhido (texto do ato, cálculo, movimentos) |
| `Vazio({ children })` | Lista vazia |
| `Card` | Formulário ou bloco que precisa de caixa |
| Tabela | `<table className="tabela">`; coluna de valor com `num` |
| Form | `Campo`, `Entrada`, `Selecao`, `AreaTexto`, `BotaoEnviar`, `MensagemFormulario`, `classeBotao` |

`Stat` continua existindo (agora sem caixa), mas prefira `Resumo`.

## Telas

| Tela | Direção |
|---|---|
| Painel (`/`) | "Para hoje": uma lista única, em ordem de urgência, com prazos, publicações a revisar, parcelas a faturar e notas a cobrar. Ao lado, um resumo do financeiro em linhas (A) |
| Prazos | Agrupar por período (Vencidos, Esta semana, Próximas semanas, Mais adiante) em linhas compactas; cálculo e base legal em `Expansivel` (B) |
| Processos / processo | Lista compacta. No processo: fases numa barra fina, dados em uma linha e abas Prazos · Linha do tempo · Cobrança (B) |
| Diário Oficial | Linhas compactas (série, cliente/processo, como achou, prazo sugerido, ações); texto do ato em `Expansivel` (B) |
| Faturamento e financeiro | Mês atual por padrão com navegação de mês; `Resumo` no topo; gráfico menor ou atrás de aba; DRE com grupos recolhíveis (C) |
| Portal, login, usuários | A |

## Textos

- Português do Brasil, frases curtas. Datas `dd/mm/aaaa` (ou `ter, 03/11` em listas), dinheiro `R$ 1.234,56`.
- Contagem de prazo sempre explicável, mas recolhida.
- O aviso "Dados fictícios" fica discreto, no pé do menu.

# Interface (redesign de 03/11)

Objetivo: uma ferramenta de trabalho, não um "dashboard". Fácil de ler, pouco scroll e o mais importante primeiro.
Quem usa são as sócias e a equipe da Eco Direito, todo dia, para saber **o que fazer agora**.

## Princípios

1. **Uma pergunta por tela.** O topo responde a pergunta da tela numa frase ("1 prazo vencido e 8 nesta semana"). Nada de fileira de cartões de KPI.
2. **Lista antes de cartão.** Conteúdo em linhas dentro de uma caixa branca (`Lista`), numa `Secao`. Nada de fileira de cartões soltos.
7. **Clicável parece clicável.** Linha que abre algo tem fundo no hover e setinha (`Linha href`); link em texto usa a classe `link` (sublinhado); filtro é controle com borda (`SegmentedLinks`); recolhido é botãozinho (`Expansivel`).
3. **Menos scroll.**
   - Lista com mais de 10 itens é paginada (`paginar` + `Paginacao`, 10 por página, `?pagina=` na URL). O contador do filtro e o "11–20 de 83" sempre batem com o total.
   - Lista longa tem busca (`Busca`, `?q=`) pelo nome da empresa e o que mais a pessoa procura ali. Busca e filtros se somam e a paginação conta o resultado filtrado.
   - Detalhe longo (texto do ato, cálculo do prazo, movimentos) fica recolhido em `Expansivel`.
   - Página com várias partes usa abas (`Abas`), não seções empilhadas.
4. **Status discreto.** Situação é ponto colorido + texto (`Situacao`). Pílula colorida (`Badge`) só para etiqueta neutra (tipo, origem). Vermelho só para o que está vencido ou atrasado.
5. **Texto de gente.** Títulos curtos, rótulos em minúsculas normais (nada de CAIXA ALTA com espaçamento), números alinhados à direita. Ajuda longa vira uma frase ou some.
6. **Ícone só quando ajuda a achar.** Menu e ações principais. Não decore título nem número.

## Identidade

- Fundo papel (`canvas`), conteúdo em caixas brancas (`surface`) com borda. Verde da marca em detalhes (menu ativo, botão principal, links). Âmbar (`accent`) só para "atenção".
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
| `on-brand` | texto sobre fundo `brand-700` (botão principal) |
| `nav`, `nav-ink`, `nav-muted`, `nav-danger` | menu lateral verde (igual nos dois modos); também a linha de total da DRE |
| `grade` | linha forte da grade da DRE (borda dos blocos de cada mês) |

Modo escuro: `data-theme="dark"` no `<html>` troca as mesmas variáveis (`globals.css`); o botão `BotaoTema` (lua/sol) fica no pé do menu, no portal e no login e guarda a escolha no navegador. Use só tokens: nada de `text-white`, `bg-white` ou cor em hex fora do menu. Na escala da marca, `brand-700` é o verde de texto e de botão nos dois modos. Variante `dark:` disponível para exceções.

## Layout

- Menu lateral verde escuro (`nav`), estreito, com 4 itens na ordem do negócio: Hoje, Propostas, Processos e Financeiro. Em cima, a busca geral (`BuscaGeral`, Ctrl+K, resultado em `/busca`) e o botão "Novo" (`BotaoNovo`, só o que o perfil pode criar). Embaixo dos itens, os atalhos fixados (`BotaoFixar` no processo, `ListaFixados` no menu), guardados no navegador de cada pessoa. Usuários, tema e "Sair" no pé.
- As telas de cada item ficam em abas no topo da página, acima do título, sempre com o componente `Abas`: Hoje tem Para fazer · Diário Oficial · Prazos (`AbasDoDia`, com a contagem do que espera alguém); Propostas tem Propostas · Prospecção (`AbasDoComercial`); Financeiro tem as abas no layout da área (`AbasDoFinanceiro`). As URLs antigas continuam valendo.
- Na lista Para fazer, o que se resolve ali tem botão na linha (Lançar no processo, Ignorar); o resto abre o lugar exato (o prazo abre a etapa dele, em `?aba=etapas&fase=`). Linha com botão não é link: o título é que leva à tela.
- A área de conteúdo usa a largura toda (até 120rem, para monitor muito largo). A partir de 1600 px, a fonte da raiz sobe para 106,25% e tudo cresce junto. Formulário usa a largura em colunas (`xl:grid-cols-4`), não campo esticado. A proposta é documento: em tela larga, a situação e as ações ficam ao lado dele.
- `PageHeader`: título + frase-resumo (`resumo`) + ações à direita. A `descricao` longa sai; se for essencial, use uma frase curta.

## Componentes (`src/components/ui`)

| Componente | Para quê |
|---|---|
| `PageHeader({ titulo, resumo?, acoes? })` | Topo da página. `resumo` é a frase que responde a pergunta da tela |
| `Resumo` + `ItemResumo({ rotulo, valor, detalhe?, tom? })` | Até 4 números numa faixa única, sem cartões |
| `Secao({ titulo, acao?, children })` | Bloco de conteúdo sem caixa: título pequeno e conteúdo |
| `Lista` / `Linha({ href?, children })` | Lista em caixa branca; com `href`, a linha inteira é link (hover + setinha) |
| `Paginacao({ ...paginar(itens, pagina), href })` | "11–20 de 83" e botões de página; some com uma página só |
| `Busca({ valor, placeholder, manter, limpar })` | Caixa de busca na URL (`?q=`), acima da lista; filtre com `combina(q, ...textos)` (`src/lib/buscar.ts`: ignora acento e maiúscula; cada palavra buscada tem de ser o começo de uma palavra do texto, então "lumen" não acha "emolumentos"; para achar CNPJ sem pontuação, passe também `documento.replace(/\D/g, '')`). Buscar volta para a página 1 |
| `Situacao({ tom, children })` | Status: ponto + texto |
| `Badge({ tom })` | Etiqueta neutra (tipo, origem) |
| `Abas({ abas, ativa })` | Abas por URL (`?aba=`), sublinhadas. Com `detalhe` (valor em reais) e `alerta`, viram uma faixa em grade, sem rolagem, e substituem o `Resumo` (Faturamento) |
| `SegmentedLinks` | Filtros por URL, controle com borda e ativo preenchido |
| `Expansivel({ resumo, children })` | Conteúdo recolhido atrás de um botãozinho (texto do ato, cálculo, movimentos) |
| `Vazio({ children })` | Lista vazia |
| `Card` | Formulário ou bloco que precisa de caixa |
| Tabela | `<table className="tabela">`; coluna de valor com `num`. A grade da DRE é a exceção: tem as próprias bordas, para as colunas travadas levarem as linhas ao rolar |
| Form | `Campo`, `Entrada`, `Selecao`, `AreaTexto`, `BotaoEnviar`, `MensagemFormulario`, `classeBotao` |

`Stat` continua existindo (agora sem caixa), mas prefira `Resumo`.

`cn` só junta classes, não resolve conflito: não passe margem (`mt-*`) para quem já tem margem própria, como `Secao` (`mt-8`, sem margem quando é a primeira). Para mudar o espaço, embrulhe numa `div`.

Texto de resumo: `contar(n, 'prazo', 'prazos')`, `juntar(['a', 'b', 'c'])` → "a, b e c" e `formatarDataLonga` → "terça, 3 de novembro" (`src/lib/formatar.ts`).

## Telas

| Tela | Direção |
|---|---|
| Hoje (`/`) | Feito. Uma lista em três grupos (Atrasado, Hoje, Próximos 7 dias) com os prazos da Eco Direito, publicações a revisar, parcelas a faturar e uma linha só para as notas atrasadas. Ao lado, o dinheiro em linhas e a edição do Diário. Os prazos da SVMA ficam em /prazos (A) |
| Prazos | Agrupar por período (Vencidos, Esta semana, Próximas semanas, Mais adiante) em linhas compactas; cálculo e base legal em `Expansivel` (B) |
| Processos / processo | Lista compacta. No processo: barra das 8 fases clicável, dados em uma linha e abas Etapas (checklist da fase) · Prazos · Linha do tempo · Cobrança |
| Diário Oficial | Linhas compactas (série, cliente/processo, como achou, prazo sugerido, ações); texto do ato em `Expansivel` (B) |
| Faturamento | Feito. Frase, faixa de abas do ciclo, busca e a tabela da aba, com botões de texto na linha. Clicar na linha abre o painel à direita (`?nota=`), sem sair da lista: `LinhaDaNota` + `PainelLateral`, em `financeiro/_components`. Detalhes em `financeiro.md` |
| Financeiro | Mês atual por padrão com navegação de mês; `Resumo` no topo; gráfico em página própria ou atrás de aba; DRE em grade de planilha, com blocos que abrem e lançamentos abaixo (`financeiro.md`) |
| Comercial | Funil em 4 colunas de cartões (o único lugar com cartões: é um quadro de etapas). A proposta abre na aba Proposta do processo, com o documento que imprime limpo (`print:hidden` no resto) |
| Portal, login, usuários | Feito. Portal: fase atual e próximo prazo numa caixa, etapas numa linha do tempo vertical. Usuários: lista com o que cada perfil pode, formulário recolhido. Login: fundo papel, sem sombra (A) |

## Textos

- Português do Brasil, frases curtas. Datas `dd/mm/aaaa` (ou `ter, 03/11` em listas), dinheiro `R$ 1.234,56`.
- Contagem de prazo sempre explicável, mas recolhida.
- O aviso "Dados fictícios" fica discreto, no pé do menu.

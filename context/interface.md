# Interface (visual Parque + Semáforo compacto, de 06/11)

Objetivo: uma ferramenta de trabalho, não um "dashboard". Quem usa são as sócias e a equipe da Eco Direito, todo dia, para saber **o que fazer agora**. O sistema tem de ser intuitivo e fácil, em tamanho normal: **não aumente letra, botão ou espaço para "facilitar"**. A primeira versão fez isso, com letra de 19 px e botão de 52 px, e as telas ficaram 2 a 2,5 vezes mais altas. Rolagem é defeito: mude a tela de lugar antes de aceitar uma tela longa.

## Redesenho 3a, "Urgência" (10/11): vale sobre o que estiver diferente abaixo

Desenho aprovado em `Redesign Eco Direito/export/Eco Direito 3a - Urgencia.html`, fora do repositório. O usuário pediu menos texto, um número grande por bloco e um clique para o detalhe, sem aumentar a fonte.
- **Fonte:** Instrument Sans. **Ícones:** Material Symbols Rounded (`Icone`, `src/components/ui/icone.tsx`), vindos do Google e recortados pela lista `ICONES`. Ícone novo precisa entrar na lista, senão aparece o nome escrito. O ícone acompanha o texto, nunca o substitui; a exceção é o sino do Diário Oficial no topo, que tem `aria-label`.
- **Casca:**
  - Menu verde-escuro (`bg-menu`, 240 px), com ícone e nome, nesta ordem: Resumo, Projetos, Propostas, Financeiro e, separado, Usuários. Projetos mostra o número vermelho de prazos vencidos. Os fixados ficam embaixo dos itens.
  - Topo branco de 60 px (`Topo`), com a busca, o aviso vermelho "N prazos vencidos" (leva a /prazos), "+ Novo", o sino (/publicacoes) e o avatar (`MenuDaConta`: nome, perfil, tema, sair). O fundo das telas é branco.
- **Logo nova:** círculo aberto, folha em traço e sol dourado (`Simbolo`, `src/app/icon.svg`), com o nome Eco Direito.
- **Resumo (`/`):**
  - Primeira linha: "Prazos vencidos" em vermelho (lista com o botão Resolver) e "Prazos nas próximas duas semanas" (três contadores e um gráfico por dia, de −6 a +14).
  - Segunda linha: os cartões Financeiro, Projetos e Propostas (`src/app/(app)/_resumo/`), cada um com o link "Abrir". Cada cartão lê os próprios dados. Financeiro só aparece para quem vê o financeiro; Propostas, só para quem vê o comercial.

## Princípios

1. **Uma pergunta por tela.** O topo responde a pergunta da tela numa frase ("1 prazo vencido e 8 nesta semana").
2. **Urgência é cor de bloco.** Vermelho atrasado, amarelo hoje, verde em dia, azul Diário Oficial (`Zona`). A cor só reforça: a situação está sempre escrita em palavra (`Situacao`).
3. **Tudo escrito.** Botão tem texto, menu tem o nome por extenso, ícone sozinho não existe. Sinais simples em texto, como `+` e `←`, podem.
4. **Fácil de acertar.** Botão e campo têm 36 px; dentro de tabela e lista, o botão é `pequeno`, com 28 px. No toque (`pointer-coarse:`), crescem para 44 e 36 px, e os links ganham altura.
5. **Nada escondido.** Nada depende de passar o mouse. Ações importantes ficam à vista, sem menu de três pontinhos. Lista com mais de 10 itens é paginada (`paginar` + `Paginacao`, `?pagina=` na URL), com busca (`Busca`, `?q=`) quando for longa.
6. **Leitura.** Corpo em 15 px, tabela em 14 px, miúdo em 13 px e nada abaixo de 12 px. Título de página em 28 px. Número grande só para o número-chave da tela. `subtle` passa de 4,5:1 de contraste.
7. **Antes do que não volta, pergunta.** Cancelar nota, apagar e remover acesso usam `BotaoConfirmar`. Ação comum continua um clique só.
8. **Depois de salvar, avisa e fica.** `MensagemFormulario` mostra o aviso e não some sozinho. Erro é frase simples, junto do campo (`Campo`).
9. **Pouca rolagem.** Lista e tabela em linhas corridas com fio fino, nunca cartões separados. Etiqueta na mesma linha do título. Formulário em colunas. Quadros numa fileira. Funil em colunas lado a lado.

## Identidade

- Página branca (`canvas`), blocos em verde bem claro (`painel`, `rail`) e itens brancos dentro deles (`surface`). Sem sombra, a não ser em menu suspenso. Cantos `rounded-md` (6 px, botão e campo) e `rounded-lg` (8 px, bloco).
- Fonte Atkinson Hyperlegible Next, com números de mesma largura. Pesos 400, 500, 600 e 700.
- Escala: `text-2xs` 12 · `text-xs` 13 · `text-sm` 14 · `text-base` 15 (padrão) · `text-lg` 16 · `text-xl` 18 · `text-2xl` 22 · `text-3xl` 26 · `text-4xl` 28.

| Token | Uso |
|---|---|
| `canvas` / `surface` | página e item branco |
| `painel` / `rail` / `apagado` | bloco neutro, menu e faixas de abas, bloco de coisa encerrada |
| `line` / `campo` | fios e borda de campo de formulário |
| `ink` / `muted` / `subtle` | texto principal, secundário, terciário |
| `brand-50` a `brand-900` | marca; `brand-700` é o verde de texto e de botão nos dois modos |
| `ok`, `warn`, `danger`, `info` (+ `-soft`) | situação; `info-tag` é a etiqueta azul do Diário, `danger-forte` o texto de erro |
| `accent` + `on-accent` | etiqueta amarela de "vence hoje" |
| `on-brand`, `on-danger`, `on-info` | texto sobre fundo preenchido |
| `grade` | linha forte da grade da DRE |

Modo escuro: `data-theme="dark"` no `<html>` troca as mesmas variáveis (`globals.css`); o botão `BotaoTema` ("Tema escuro") fica no pé do menu, no portal e no login e guarda a escolha no navegador. Use só tokens: nada de `text-white`, `bg-white` ou cor em hex. Variante `dark:` disponível para exceções.

## Layout

- Menu lateral claro (`rail`, 224 px), com os itens por extenso, na ordem do negócio: Hoje, Propostas, Projetos, Financeiro e Usuários. Em cima, a busca geral (`BuscaGeral`, Ctrl+K, resultado em `/busca`) e o botão "+ Novo" (`BotaoNovo`, só o que o perfil pode criar). Abaixo dos itens, os atalhos fixados (`BotaoFixar` no projeto, `ListaFixados` no menu), guardados no navegador de cada pessoa. No pé, quem está entrando, "Tema escuro", "Sair" e o aviso de dados fictícios. Em tela estreita, o menu vira um bloco no topo da página, que rola junto.
- As telas de cada item ficam em abas no topo da página, acima do título, sempre com o componente `Abas`: Hoje tem Para fazer · Diário Oficial · Prazos (`AbasDoDia`, com a contagem do que espera alguém); Propostas tem Propostas · Prospecção (`AbasDoComercial`); Financeiro tem as abas no layout da área (`AbasDoFinanceiro`). As URLs antigas continuam valendo.
- Na lista Para fazer, o que se resolve ali tem botão na linha (Lançar no projeto, Ignorar); o resto abre o lugar exato (o prazo abre a etapa dele, em `?aba=etapas&fase=`). Linha com botão não é link: o título é que leva à tela.
- A área de conteúdo usa a largura toda (até 120rem, para monitor muito largo). A partir de 1600 px, a fonte da raiz sobe para 106,25% e tudo cresce junto. Formulário usa a largura em colunas (`sm:grid-cols-2 xl:grid-cols-4`, até 72rem), não campo esticado. A proposta é documento: em tela larga, a situação e as ações ficam ao lado dele.
- `PageHeader`: título de 28 px + frase-resumo (`resumo`) + ações à direita. `voltar` põe "← Voltar para …" em cima.

## Componentes (`src/components/ui`)

| Componente | Para quê |
|---|---|
| `PageHeader({ titulo, resumo?, acoes?, voltar? })` | Topo da página. `resumo` é a frase que responde a pergunta da tela |
| `Zona({ tom, titulo, detalhe?, acao? })` + `Item({ etiqueta?, titulo, detalhe?, fim? })` | Bloco colorido pela urgência (`atraso`, `hoje`, `proximos`, `neutra`, `apagada`, `diario`) e as linhas brancas dele, coladas, com etiqueta e título na mesma linha |
| `Resumo` + `ItemResumo({ rotulo, valor, detalhe?, tom? })` | Números em linhas: rótulo à esquerda, valor à direita, em duas colunas quando cabe |
| `Secao({ titulo, acao?, children })` | Bloco de conteúdo sem caixa: título e conteúdo |
| `Lista` / `Linha({ href?, acao?, children })` | Linhas corridas com fio fino; com `href`, o item inteiro é link e mostra o botão pequeno `acao` ("Abrir") |
| `Paginacao({ ...paginar(itens, pagina), href })` | "11–20 de 83" e botões de página; some com uma página só |
| `Busca({ valor, placeholder, manter, limpar })` | Caixa de busca na URL (`?q=`), acima da lista; filtre com `combina(q, ...textos)` (`src/lib/buscar.ts`: ignora acento e maiúscula; cada palavra buscada tem de ser o começo de uma palavra do texto, então "lumen" não acha "emolumentos"; para achar CNPJ sem pontuação, passe também `documento.replace(/\D/g, '')`). Buscar volta para a página 1 |
| `Situacao({ tom, children })` / `Badge({ tom })` | Etiqueta com a palavra escrita: `danger` vermelha, `warn` amarela, `ok` verde cheia, `brand` contorno, `info` azul, `neutral` |
| `LinkRapido` | Igual ao `Link`, mas prepara a tela com o mouse em cima, foco ou toque, e mostra uma barra amarela no topo se a tela demorar mais de 200 ms. É o link padrão da área interna |
| `Abas({ abas, ativa })` | Abas por URL (`?aba=`), a ativa preenchida de verde. Com `detalhe` (valor em reais), `legenda`, `fundo` e `alerta`, viram quadros numa fileira só em tela larga (Faturamento) |
| `SegmentedLinks({ opcoes, ativo, rotulo? })` | Filtros por URL, o ativo preenchido, com o nome do filtro ao lado |
| `Expansivel({ resumo, children })` | Conteúdo recolhido atrás de um link com `+` (cálculo, movimentos, marcar etapa) |
| `Vazio({ children })` | Lista vazia |
| `Card({ titulo?, acao?, flush? })` | Bloco em verde bem claro; `flush` é para tabela: fundo branco com fio em volta, e rola para o lado em tela pequena |
| Tabela | `<table className="tabela">` dentro de `Card flush`: linhas corridas com fio fino, largura mínima de 46rem; coluna de valor com `num`. Abaixo de 768 px, `TABELA_EMPILHADA` vira cartões. A grade da DRE é a exceção: tem as próprias bordas, para as colunas travadas levarem as linhas ao rolar |
| `TrilhaDeFases({ fases })` / `FaseProgresso({ fase })` | As 8 fases: barra com nome e situação no projeto e no portal, só a barra na lista (`components/processos`) |
| `BotaoConfirmar({ titulo, oQue?, consequencia?, sim })` | Caixa "Não, voltar / Sim, …" para o que não dá para desfazer. Vai dentro do `<form>`, no lugar do botão de enviar; o "sim" é que envia |
| Form | `Campo` (rótulo, `dica` e `erro` sempre visíveis), `Entrada`, `Selecao`, `AreaTexto`, `BotaoEnviar`, `MensagemFormulario`, `classeBotao(variante, className, tamanho)` (`primario`, `secundario`, `perigo`, `diario`, `diario-claro`; `normal` ou `pequeno`). `Botao`, `BotaoEnviar` e `BotaoConfirmar` aceitam `tamanho` |

`cn` só junta classes, não resolve conflito: não passe margem (`mt-*`) para quem já tem margem própria, como `Secao` (`mt-5`, sem margem quando é a primeira). Para mudar o espaço, embrulhe numa `div`.

Texto de resumo: `contar(n, 'prazo', 'prazos')`, `juntar(['a', 'b', 'c'])` → "a, b e c" e `formatarDataLonga` → "terça, 3 de novembro" (`src/lib/formatar.ts`).

## Telas

As cores, os blocos e o tudo escrito vêm do desenho "Parque + Semáforo" do Claude Design. Os tamanhos do desenho **não** valem mais: a escala é a deste guia.

| Tela | Direção |
|---|---|
| Hoje (`/`) | Abas ao lado do título. Zonas Atrasado, Hoje e Próximos 7 dias, com prazos da Eco Direito, publicações a revisar, parcelas a faturar e uma linha só para as notas atrasadas. Ao lado, blocos Dinheiro e Diário Oficial. Os prazos da SVMA ficam em /prazos |
| Prazos | Zonas por período (Vencidos, Esta semana, Próximas semanas, Mais adiante); cálculo e base legal em `Expansivel` |
| Projetos / projeto | Lista com fases pequenas e próximo prazo. No projeto: `TrilhaDeFases` clicável e abas Etapas (checklist da fase), Proposta, Prazos, Linha do tempo e Cobrança |
| Diário Oficial | Atos em blocos, com o que acontece ao lançar; texto do ato em `Expansivel` |
| Faturamento | Frase, quadros do ciclo (`Abas` com `detalhe`), busca e a tabela do quadro, com botões de texto na linha. Clicar na linha abre o painel à direita (`?nota=`), sem sair da lista: `LinhaDaNota` + `PainelLateral`, em `financeiro/_components`. Detalhes em `financeiro.md` |
| Financeiro | Mês atual por padrão com navegação de mês; DRE em grade de planilha, com blocos que abrem e lançamentos abaixo (`financeiro.md`) |
| Propostas | Funil em quatro colunas lado a lado, cada etapa numa `Zona` com cartões. A proposta abre na aba Proposta do projeto, com o documento que imprime limpo (`print:hidden` no resto) |
| Portal, login, usuários | Portal: fase atual, próximo prazo e `TrilhaDeFases`. Login: faixa verde à esquerda e formulário à direita, em tela larga |

## Textos

- O trabalho para o cliente é **projeto**, nunca "processo". "Processo" só para o processo oficial na SVMA (veja `produto.md`).
- Português do Brasil, frases curtas. Datas `dd/mm/aaaa` (ou `ter, 03/11` em listas), dinheiro `R$ 1.234,56`.
- Contagem de prazo sempre explicável, mas recolhida.
- O aviso "Dados fictícios" fica discreto, no pé do menu.

## Identidade visual (09/11)

A ideia: uma ferramenta de trabalho que lembra o propósito, o meio ambiente e o papel do processo. Tudo discreto; a escala compacta continua valendo.

- **Marca:** `Simbolo` e `Logo` em `src/components/marca/logo.tsx`. Folha com nervura sobre quadrado verde, com o sol amarelo no canto: "folha" é planta e é página. O favicon é `src/app/icon.svg`, o mesmo desenho.
- **Copa** (`.copa`): o gradiente verde da marca. Usado no item ativo do menu, na faixa acima do título (`PageHeader`) e no fundo do login. Não use em blocos grandes dentro das telas.
- **Relevo** (`.relevo`): curvas de nível bem claras no fundo da área interna, com luz verde e amarela nos cantos.
- **Vidro** (`.vidro`): painel translúcido com reflexo em cima, só sobre fundo com relevo ou copa.
- **Folhagem** (`.menu-folhagem`): o menu, em degradê verde de cima para baixo (claro e escuro). O login é dividido: verde à esquerda, `.lado-claro` à direita com o cartão branco.
- **Espelho** (`.reflexo`): o símbolo refletido embaixo, só no login.
- **Brilho** (`.brilho`): faixa de luz bem fraca ao passar o mouse. Use pouco: em botão e menu ficou insistente e saiu.
- **Surgir** (`.surgir`): os blocos da tela sobem de leve ao abrir. Está no `<main>` da área interna; não repita dentro das telas.
- **Natureza** (`src/components/marca/natureza.tsx`): `CurvasDeNivel` (traço claro, para fundo verde) e `FolhasCaindo`.
- **Trilha que cresce** (`TrilhaDeFases`, `FaseProgresso`): fase feita em copa; a atual pela metade, com um broto na ponta; a seguir em `line`. No escuro, a copa vira `brand-700` (feita) e `brand-500` (atual), que aparecem sobre o fundo escuro.
- **Portal**: topo em copa com `CurvasDeNivel` e `Logo claro`, página em `relevo`.
- **Hover**: cartão do funil de Propostas sobe 1 px com sombra leve; linha da lista de Projetos ganha um traço verde à esquerda (numa lista corrida, subir a linha a faria pular).
- Todo movimento para com `prefers-reduced-motion`.

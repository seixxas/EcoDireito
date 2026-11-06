# Interface (visual Parque + Semáforo, de 05/11)

Objetivo: uma ferramenta de trabalho, não um "dashboard". Quem usa são as sócias e a equipe da Eco Direito, com mais de 60 anos, todo dia, para saber **o que fazer agora**. O sistema tem de ser fácil de ver e fácil de clicar. Na dúvida entre mostrar mais e deixar mais claro, deixe mais claro.

## Princípios

1. **Uma pergunta por tela.** O topo responde a pergunta da tela numa frase ("1 prazo vencido e 8 nesta semana").
2. **Urgência é cor de bloco.** Vermelho atrasado, amarelo hoje, verde em dia, azul Diário Oficial (`Zona`). A cor só reforça: a situação está sempre escrita em palavra (`Situacao`).
3. **Tudo escrito.** Botão tem texto, menu tem o nome por extenso, ícone sozinho não existe. Sinais simples em texto, como `+` e `←`, podem.
4. **Fácil de acertar.** Tudo o que se clica tem pelo menos 48 px de altura e 12 px do vizinho, inclusive abas, paginação e ações dentro de tabela. Links dentro de frase são a exceção.
5. **Nada escondido.** Nada depende de passar o mouse. Ações importantes ficam à vista, sem menu de três pontinhos. Lista com mais de 10 itens é paginada (`paginar` + `Paginacao`, `?pagina=` na URL), com busca (`Busca`, `?q=`) quando for longa.
6. **Letra grande.** Nada abaixo de 16 px. Texto cinza claro não existe: `muted` e `subtle` passam de 7:1 de contraste.
7. **Antes do que não volta, pergunta.** Cancelar nota, apagar e remover acesso usam `BotaoConfirmar`. Ação comum continua um clique só.
8. **Depois de salvar, avisa e fica.** `MensagemFormulario` mostra o aviso e não some sozinho. Erro é frase simples, junto do campo (`Campo`).

## Identidade

- Página branca (`canvas`), blocos em verde bem claro (`painel`, `rail`) e itens brancos dentro deles (`surface`). Sem sombra, a não ser em menu suspenso. Cantos `rounded-md` (10 px, botão e campo), `rounded-lg` (14 px, item) e `rounded-xl` (20 px, bloco).
- Fonte Atkinson Hyperlegible Next, feita para leitura difícil, com números de mesma largura. Em `globals.css`, `font-medium` é 700 e `font-semibold` é 800.
- Escala: `text-2xs` 16 · `text-xs` 17 · `text-sm` 18 · `text-base` 19 (padrão) · `text-lg` 21 · `text-xl` 26 · `text-2xl` 34 · `text-3xl` 42 · `text-4xl` 56.

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

- Menu lateral claro (`rail`, 272 px), com os itens por extenso em ladrilhos brancos, na ordem do negócio: Hoje, Propostas, Projetos, Financeiro e Usuários. Em cima, a busca geral (`BuscaGeral`, parada parece botão, Ctrl+K, resultado em `/busca`) e o botão "+ Novo" (`BotaoNovo`, só o que o perfil pode criar). Abaixo dos itens, os atalhos fixados (`BotaoFixar` no projeto, `ListaFixados` no menu), guardados no navegador de cada pessoa. No pé, quem está entrando, "Tema escuro", "Sair" e o aviso de dados fictícios. Em tela estreita, o menu vira um bloco no topo da página, que rola junto.
- As telas de cada item ficam em abas no topo da página, acima do título, sempre com o componente `Abas`: Hoje tem Para fazer · Diário Oficial · Prazos (`AbasDoDia`, com a contagem do que espera alguém); Propostas tem Propostas · Prospecção (`AbasDoComercial`); Financeiro tem as abas no layout da área (`AbasDoFinanceiro`). As URLs antigas continuam valendo.
- Na lista Para fazer, o que se resolve ali tem botão na linha (Lançar no projeto, Ignorar); o resto abre o lugar exato (o prazo abre a etapa dele, em `?aba=etapas&fase=`). Linha com botão não é link: o título é que leva à tela.
- A área de conteúdo usa a largura toda (até 120rem, para monitor muito largo). A partir de 1600 px, a fonte da raiz sobe para 106,25% e tudo cresce junto. Formulário usa a largura em colunas (`xl:grid-cols-4`), não campo esticado. A proposta é documento: em tela larga, a situação e as ações ficam ao lado dele.
- `PageHeader`: título de 56 px + frase-resumo (`resumo`) + ações à direita, com fio embaixo. `voltar` põe "← Voltar para …" em cima.

## Componentes (`src/components/ui`)

| Componente | Para quê |
|---|---|
| `PageHeader({ titulo, resumo?, acoes?, voltar? })` | Topo da página. `resumo` é a frase que responde a pergunta da tela |
| `Zona({ tom, titulo, detalhe?, acao? })` + `Item({ etiqueta?, titulo, detalhe?, fim? })` | Bloco colorido pela urgência (`atraso`, `hoje`, `proximos`, `neutra`, `apagada`, `diario`) e os itens brancos dele |
| `Resumo` + `ItemResumo({ rotulo, valor, detalhe?, tom? })` | Números em linhas: rótulo à esquerda, valor à direita, em duas colunas quando cabe |
| `Secao({ titulo, acao?, children })` | Bloco de conteúdo sem caixa: título e conteúdo |
| `Lista` / `Linha({ href?, acao?, children })` | Itens brancos num bloco; com `href`, o item inteiro é link e mostra o botão `acao` ("Abrir") |
| `Paginacao({ ...paginar(itens, pagina), href })` | "11–20 de 83" e botões de página; some com uma página só |
| `Busca({ valor, placeholder, manter, limpar })` | Caixa de busca na URL (`?q=`), acima da lista; filtre com `combina(q, ...textos)` (`src/lib/buscar.ts`: ignora acento e maiúscula; cada palavra buscada tem de ser o começo de uma palavra do texto, então "lumen" não acha "emolumentos"; para achar CNPJ sem pontuação, passe também `documento.replace(/\D/g, '')`). Buscar volta para a página 1 |
| `Situacao({ tom, children })` / `Badge({ tom })` | Etiqueta com a palavra escrita: `danger` vermelha, `warn` amarela, `ok` verde cheia, `brand` contorno, `info` azul, `neutral` |
| `LinkRapido` | Igual ao `Link`, mas prepara a tela com o mouse em cima, foco ou toque, e mostra uma barra amarela no topo se a tela demorar mais de 200 ms. É o link padrão da área interna |
| `Abas({ abas, ativa })` | Abas por URL (`?aba=`), a ativa preenchida de verde. Com `detalhe` (valor em reais), `legenda`, `fundo` e `alerta`, viram quadros em grade (Faturamento) |
| `SegmentedLinks({ opcoes, ativo, rotulo? })` | Filtros por URL, o ativo preenchido, com o nome do filtro em cima |
| `Expansivel({ resumo, children })` | Conteúdo recolhido atrás de um botão (texto do ato, cálculo, movimentos) |
| `Vazio({ children })` | Lista vazia |
| `Card({ titulo?, acao?, flush? })` | Bloco em verde bem claro; `flush` é para tabela, que rola para o lado em tela pequena |
| Tabela | `<table className="tabela">` dentro de `Card flush`: cada linha é uma faixa branca, com largura mínima de 52rem; coluna de valor com `num`. A grade da DRE é a exceção: tem as próprias bordas, para as colunas travadas levarem as linhas ao rolar |
| `TrilhaDeFases({ fases })` / `FaseProgresso({ fase })` | As 8 fases: grande no projeto e no portal, pequena na lista (`components/processos`) |
| `BotaoConfirmar({ titulo, oQue?, consequencia?, sim })` | Caixa "Não, voltar / Sim, …" para o que não dá para desfazer. Vai dentro do `<form>`, no lugar do botão de enviar; o "sim" é que envia |
| Form | `Campo` (rótulo, `dica` e `erro` sempre visíveis), `Entrada`, `Selecao`, `AreaTexto`, `BotaoEnviar`, `MensagemFormulario`, `classeBotao` (`primario`, `secundario`, `perigo`, `diario`, `diario-claro`) |

`cn` só junta classes, não resolve conflito: não passe margem (`mt-*`) para quem já tem margem própria, como `Secao` (`mt-8`, sem margem quando é a primeira). Para mudar o espaço, embrulhe numa `div`.

Texto de resumo: `contar(n, 'prazo', 'prazos')`, `juntar(['a', 'b', 'c'])` → "a, b e c" e `formatarDataLonga` → "terça, 3 de novembro" (`src/lib/formatar.ts`).

## Telas

O desenho de referência é o HTML "Parque + Semáforo" do Claude Design, com 21 telas. As demais seguem o mesmo estilo.

| Tela | Direção |
|---|---|
| Hoje (`/`) | Abas ao lado do título. Zonas Atrasado, Hoje e Próximos 7 dias, com prazos da Eco Direito, publicações a revisar, parcelas a faturar e uma linha só para as notas atrasadas. Ao lado, blocos Dinheiro e Diário Oficial. Os prazos da SVMA ficam em /prazos |
| Prazos | Zonas por período (Vencidos, Esta semana, Próximas semanas, Mais adiante); cálculo e base legal em `Expansivel` |
| Projetos / projeto | Lista com fases pequenas e próximo prazo. No projeto: `TrilhaDeFases` clicável e abas Etapas (checklist da fase), Proposta, Prazos, Linha do tempo e Cobrança |
| Diário Oficial | Atos em blocos, com o que acontece ao lançar; texto do ato em `Expansivel` |
| Faturamento | Frase, quadros do ciclo (`Abas` com `detalhe`), busca e a tabela do quadro, com botões de texto na linha. Clicar na linha abre o painel à direita (`?nota=`), sem sair da lista: `LinhaDaNota` + `PainelLateral`, em `financeiro/_components`. Detalhes em `financeiro.md` |
| Financeiro | Mês atual por padrão com navegação de mês; DRE em grade de planilha, com blocos que abrem e lançamentos abaixo (`financeiro.md`) |
| Propostas | Funil por etapas, cada uma numa `Zona` com cartões. A proposta abre na aba Proposta do projeto, com o documento que imprime limpo (`print:hidden` no resto) |
| Portal, login, usuários | Portal: fase atual, próximo prazo e `TrilhaDeFases`. Login: faixa verde à esquerda e formulário à direita, em tela larga |

## Textos

- O trabalho para o cliente é **projeto**, nunca "processo". "Processo" só para o processo oficial na SVMA (veja `produto.md`).
- Português do Brasil, frases curtas. Datas `dd/mm/aaaa` (ou `ter, 03/11` em listas), dinheiro `R$ 1.234,56`.
- Contagem de prazo sempre explicável, mas recolhida.
- O aviso "Dados fictícios" fica discreto, no pé do menu.

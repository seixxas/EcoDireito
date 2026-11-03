# Interface

## Identidade

- Fontes: Bricolage Grotesque (títulos, `font-display`) e IBM Plex Sans (texto, `font-sans`), via `next/font`.
- Cores (tokens em `globals.css`, use só as classes):

| Token | Uso |
|---|---|
| `canvas` / `surface` / `line` | fundo da página, cartões, bordas |
| `ink` / `muted` / `subtle` | texto principal, secundário, terciário |
| `brand-50` a `brand-900` | verde da marca (menu, botões, destaques) |
| `ok`, `warn`, `danger`, `info` (+ `-soft`) | situação: em dia, atenção, vencido, informação |

## Significado das cores (igual em todo o sistema)

- Verde `ok`: cumprido, recebido, no prazo.
- Âmbar `warn`: vence em até 10 dias, a receber, parcela liberada para faturar.
- Vermelho `danger`: vencido, atrasado.
- Azul `info`: expectativa do órgão, informação.
- Cinza: cancelado, aguardando.

## Componentes (`src/components/ui`)

- `Card`: bloco com título opcional e ação à direita.
- `Badge`: etiqueta com `tone`.
- `Stat`: número grande de KPI, com legenda e tom.
- `PageHeader`: título, descrição e ações da página.
- `SegmentedLinks`: abas de filtro por URL.
- `Carregando`: esqueleto usado por todos os `loading.tsx`.
- Tabelas: `<table className="tabela">` (com `num` nas colunas de valor).

## Componentes de domínio

- `components/prazos/situacao-prazo.tsx`: etiqueta do prazo. Prazo do órgão atrasado fica âmbar ("SVMA atrasada"), não vermelho.
- `components/processos/fase-progresso.tsx`: barra das 7 fases.
- `components/financeiro/situacao-nota.tsx`: etiqueta da nota e os rótulos de cada situação.
- `components/charts/*`: Recharts com a prop `responsive` (não use `ResponsiveContainer`). Recebem centavos e formatam sozinhos.

## Textos

- Português do Brasil, frases curtas, sem jargão técnico de TI.
- Datas `dd/mm/aaaa`; dinheiro `R$ 1.234,56`. Use `formatarData` e `brl`.
- Contagem de prazo sempre explicada ("30 dias corridos a partir de 06/11; vence seg 07/12").
- Toda tela com dado fictício mostra o selo "Dados fictícios" (no menu lateral).

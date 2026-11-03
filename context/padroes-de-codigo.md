# Padrões de código

Objetivo: o menor código que resolve o pedido, fácil de ler na próxima sessão.

## Princípios

- Faça só o que foi pedido. Nada de "já que estou aqui".
- Sem abstração antes do terceiro uso. Duplicar duas vezes é mais barato que abstrair errado.
- Sem comentário que repete o código. Comente só o porquê não óbvio (regra legal, gambiarra consciente).
- Dependência nova só com motivo forte, registrado em `context/decisoes.md`.
- Apague o que ficou sem uso. Não deixe código comentado.

## Camadas (de fora para dentro)

```
app/ (rotas e composição)  →  data/ (acesso a dados)  →  domain/ (regras puras)  →  lib/ (utilitários)
```

- **`src/domain`**: regras de negócio puras. Sem React, sem Next, sem I/O. Toda regra com teste.
- **`src/data`**: a única porta para os dados. Hoje lê `src/data/seed`; amanhã, o banco. Páginas nunca importam `seed` direto.
- **`src/app`**: páginas buscam dados em `data/`, calculam com `domain/` e montam a tela.
- **`src/components`**: UI reutilizável. Componente usado por uma rota só fica em `app/<rota>/_components/`.

## Next.js 16 (Cache Components ligado)

- Server Component é o padrão. `"use client"` só para interação: gráfico, estado local, clique.
- Componente cliente recebe dados prontos e serializáveis (strings, números, arrays). Nada de funções nem `Date`.
- A data de hoje vem **só** de `hoje()` em `src/data/hoje.ts`, que chama `connection()`. Nunca use `new Date()` ou `Date.now()` em componente de servidor.
- Toda rota nova tem o seu `loading.tsx`, de uma linha: `export { Carregando as default } from '@/components/ui/carregando'`. Sem ele, o Next acusa navegação bloqueante.
- Componente cliente que lê a URL (`usePathname`, `useSearchParams`) fica dentro de `<Suspense>` (veja `menu-lateral.tsx`).
- `params` e `searchParams` são Promises: use `await`.
- Filtros de lista ficam na URL (`?situacao=atrasada`), lidos com `searchParams`. Evite estado de cliente para isso.

## Tipos e valores

- Datas: `DataISO` (`'2026-11-03'`). Toda conta com data passa por `src/lib/datas.ts`. Fuso: America/Sao_Paulo.
- Dinheiro: `Centavos` (inteiro). Nunca use float para dinheiro. Para exibir, use `brl()` de `src/lib/formatar.ts`.
- Sem `any`. Prefira `type` a `interface`. Unions derivadas de arrays `as const`.
- Status são calculados por funções do domínio (`situacaoPrazo`, `situacaoNota`), nunca gravados à mão.

## Nomes

- Domínio em português, sem acento: `processo`, `prazo`, `notaFiscal`, `calcularVencimento`.
- UI genérica em inglês: `Card`, `Badge`, `Stat`.
- Arquivos em kebab-case. Componentes em PascalCase, com export nomeado. `export default` só onde o Next exige (page, layout, loading).

## Estilo

- Tailwind com os tokens de `src/app/globals.css` (`bg-canvas`, `text-muted`, `bg-brand-700`). Nada de cor hex em componente.
- Tabelas usam a classe `tabela` (definida em `globals.css`).
- Juntar classes condicionais: `cn()` de `src/lib/cn.ts`.

## Testes e commit

- Regra de domínio nova ou alterada: teste em `*.test.ts` ao lado do arquivo (Vitest).
- Antes de commitar: `npm run typecheck && npm run lint && npm test`. Em mudança de rota ou config, rode também `npm run build`.
- Um commit por alteração, mensagem em português no formato `tipo: o que mudou`.

## Exemplo: "adicionar um botão na tela de prazos"

1. Leia `estado-atual.md`, este arquivo e `prazos.md`.
2. Abra só `src/app/(app)/prazos/page.tsx` e o `_components` dela, se houver.
3. Reuse `src/components/ui`. Se o botão muda dados, a regra vai para `domain/` e o acesso para `data/`.
4. Rode as checagens, commite e atualize `estado-atual.md` se a tela mudou.

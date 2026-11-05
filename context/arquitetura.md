# Arquitetura

## Stack

- Next.js 16 (App Router, Cache Components), React 19, TypeScript estrito.
- Tailwind CSS 4 com tokens em `src/app/globals.css`.
- Recharts (gráficos, só em componentes cliente) e lucide-react (ícones).
- Vitest para regras de domínio.
- Demonstração na Vercel: https://eco-direito.vercel.app, com banco Neon (Postgres) já conectado, ainda sem uso no código.
- Banco: Neon (Postgres) com Drizzle (`drizzle-orm/neon-http`). Schema em `src/db/schema/<area>.ts`; `npm run db:push` aplica o schema e `npm run db:seed` grava a base fictícia (precisam do `.env.local`).
- Sem `DATABASE_URL`, as telas usam os dados fictícios em memória (útil em teste e em worktree sem `.env.local`); gravar exige banco.
- Formulários: Server Actions + Zod (`src/lib/formulario.ts`) + kit em `src/components/ui/form.tsx`.
- Login: Better Auth (`src/lib/auth.ts`, rota `src/app/api/auth/[...all]`), sessão lida em `src/data/sessao.ts` (`usuarioAtual`, `exigirUsuario`, `exigirArea`); `src/proxy.ts` manda para `/login` quem não tem cookie.
- Variáveis: `DATABASE_URL`, `DATABASE_URL_UNPOOLED`, `BETTER_AUTH_SECRET`, `SENHA_DEMO` (local); na Vercel também `BETTER_AUTH_URL`.
- Planejado, ainda não instalado: jobs agendados para o robô e Resend para e-mail.

## Pastas

```
src/
  app/
    layout.tsx, globals.css    raiz: fontes, tokens
    (app)/                     área interna com menu lateral (loading.tsx = Suspense)
      page.tsx                 Painel
      prazos/                  vencimentos de todos os processos
      processos/ + [id]/       lista e detalhe do processo; novo, editar e clientes/
      publicacoes/             caixa de entrada do Diário Oficial
      financeiro/              faturamento (notas)
      financeiro/receber/      redireciona para a aba Atrasadas do faturamento
      financeiro/lucratividade/  lucratividade por projeto (simulação)
      financeiro/faturado-recebido/  gráfico faturado × recebido
      financeiro/dre/          DRE caixa e competência
      financeiro/fluxo/        fluxo de caixa realizado e projetado
    portal/[id]/               portal do cliente (sem menu interno)
  components/
    ui/                        Card, Badge, PageHeader, SegmentedLinks, LinkRapido, Carregando
    layout/                    menu lateral
    charts/                    gráficos (cliente)
    prazos/ financeiro/ processos/   componentes de domínio compartilhados
  domain/                      regras puras + testes
  db/                          conexão, schema por área e seed do banco
  data/                        acesso a dados (banco; sem banco, seed em memória)
    seed/                      geradores de dados fictícios
  robo/                        coletores de fontes externas (DOC-SP), sem banco: baixam e convertem para o domínio
  lib/                         datas, dinheiro, formatação, cn
```

## Fluxo de dados

```
page.tsx → data/*.ts (await hoje(), lê seed) → domain/*.ts (calcula) → componentes
```

- `data/` expõe funções assíncronas (`listarProcessos()`, `listarNotas()`). Elas já têm a assinatura que o banco vai usar.
- O seed é gerado a partir da data de hoje e fica em cache em memória, uma geração por dia.
- `DATA_DEMO=2026-11-03` no `.env.local` congela a data para uma apresentação.

## Velocidade da navegação

- As funções rodam em `gru1` (São Paulo), junto do banco (`vercel.json`). Em `iad1`, cada consulta atravessava o continente.
- `carregar()` lê as 11 tabelas num `db.batch` (um pedido só ao Neon), em paralelo com a sessão.
- **Não há cache de dados no servidor.** `use cache: private` guarda a tela pronta só no navegador de quem pediu, por 60 segundos (`src/data/telas.ts`). O servidor sempre lê o banco.
- `LinkRapido` prepara a tela com o mouse em cima (ou foco, ou toque), então o clique já a encontra pronta. Voltar a uma tela vista há menos de 60 segundos não vai ao servidor.
- **Depois de gravar, `atualizarTelas()`.** O `updateTag` dali é indispensável: o Next retém a leitura privada até o fim da requisição, e sem ele a tela refeita na resposta da ação usaria a leitura de antes de gravar. Por isso também vale: dentro de uma ação, ler pela base depois de gravar sem chamar `atualizarTelas()` antes devolve o dado velho.
- Sair e entrar também chamam `atualizarTelas()`: a próxima pessoa no mesmo navegador não pode ver a tela de quem saiu.
- O que outra pessoa gravou aparece em até 60 segundos, ou com F5.
- **Uma fronteira de carregamento só**, no layout de `(app)`, acima das páginas. Ao trocar de tela, o React mantém a tela atual até a nova ficar pronta. Com um `loading.tsx` por rota, o esqueleto aparecia a cada clique, e o React o segura por pelo menos 300 ms (`globalMostRecentFallbackTime + 300` em react-dom), mesmo com a resposta pronta antes. Espera longa aparece na barra do `LinkRapido`.

## Trocar o mock pelo banco (próximo passo estrutural)

1. Criar o schema Drizzle a partir dos tipos de `src/domain` e apontar para a `DATABASE_URL` do Neon (`vercel env pull` traz as variáveis para o `.env.local`).
2. Reimplementar as funções de `src/data/*.ts` com consultas, mantendo as assinaturas.
3. Rodar o seed fictício no banco de desenvolvimento.
4. Páginas e domínio não mudam.

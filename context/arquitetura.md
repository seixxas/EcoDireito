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
      processos/ + [id]/       lista e detalhe do processo
      publicacoes/             caixa de entrada do Diário Oficial
      financeiro/              faturamento (notas)
      financeiro/receber/      contas a receber
      financeiro/dre/          DRE caixa e competência
      financeiro/fluxo/        fluxo de caixa realizado e projetado
    portal/[id]/               portal do cliente (sem menu interno)
    (cada rota tem seu loading.tsx)
  components/
    ui/                        Card, Badge, Stat, PageHeader, SegmentedLinks, Carregando
    layout/                    menu lateral
    charts/                    gráficos (cliente)
    prazos/ financeiro/ processos/   componentes de domínio compartilhados
  domain/                      regras puras + testes
  db/                          conexão, schema por área e seed do banco
  data/                        acesso a dados (banco; sem banco, seed em memória)
    seed/                      geradores de dados fictícios
  lib/                         datas, dinheiro, formatação, cn
```

## Fluxo de dados

```
page.tsx → data/*.ts (await hoje(), lê seed) → domain/*.ts (calcula) → componentes
```

- `data/` expõe funções assíncronas (`listarProcessos()`, `listarNotas()`). Elas já têm a assinatura que o banco vai usar.
- O seed é gerado a partir da data de hoje e fica em cache em memória, uma geração por dia.
- `DATA_DEMO=2026-11-03` no `.env.local` congela a data para uma apresentação.

## Trocar o mock pelo banco (próximo passo estrutural)

1. Criar o schema Drizzle a partir dos tipos de `src/domain` e apontar para a `DATABASE_URL` do Neon (`vercel env pull` traz as variáveis para o `.env.local`).
2. Reimplementar as funções de `src/data/*.ts` com consultas, mantendo as assinaturas.
3. Rodar o seed fictício no banco de desenvolvimento.
4. Páginas e domínio não mudam.

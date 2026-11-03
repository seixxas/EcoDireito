# Arquitetura

## Stack

- Next.js 16 (App Router, Cache Components), React 19, TypeScript estrito.
- Tailwind CSS 4 com tokens em `src/app/globals.css`.
- Recharts (gráficos, só em componentes cliente) e lucide-react (ícones).
- Vitest para regras de domínio.
- Planejado, ainda não instalado: Supabase (Postgres, auth) com Drizzle, jobs agendados para o robô e Resend para e-mail.

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
  data/                        acesso a dados (hoje: seed em memória)
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

1. Criar o schema Drizzle a partir dos tipos de `src/domain`.
2. Reimplementar as funções de `src/data/*.ts` com consultas, mantendo as assinaturas.
3. Rodar o seed fictício no banco de desenvolvimento.
4. Páginas e domínio não mudam.

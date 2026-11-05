# Eco Direito — prazos e financeiro

Sistema web da Awer para a Eco Direito Ambiental. Controla os prazos dos processos de
licenciamento na Secretaria do Verde (SVMA, Prefeitura de SP) e o financeiro (notas,
contas a receber, DRE, fluxo de caixa). Hoje roda com dados fictícios em memória; o banco vem depois.

## Antes de qualquer alteração, leia nesta ordem

1. `context/estado-atual.md`: o que já existe e o que vem a seguir.
2. `context/plano.md`: etapas, qual sessão faz o quê e as regras para trabalhar em paralelo.
3. `context/padroes-de-codigo.md`: regras de código (obrigatório).
4. Só o contexto da área que a tarefa toca:

| Área | Arquivo | Leia quando mexer em |
|---|---|---|
| Produto e glossário | `context/produto.md` | regra de negócio nova, termos (SEI, TCA, Comunique-se) |
| Arquitetura | `context/arquitetura.md` | pastas, camadas, rotas, troca do mock por banco |
| Interface | `context/interface.md` | telas, componentes, cores, textos |
| Prazos e processos | `context/prazos.md` | `src/domain/prazos.ts`, `src/domain/processos.ts`, `/prazos`, `/projetos`, `/portal` |
| Diário Oficial | `context/publicacoes.md` | `src/domain/publicacoes.ts`, `/publicacoes` |
| Financeiro | `context/financeiro.md` | `src/domain/financeiro/*`, `/financeiro/*` |
| Dados fictícios | `context/dados-demo.md` | `src/data/seed/*` |
| Decisões | `context/decisoes.md` | antes de qualquer mudança estrutural ou dependência nova |

Não leia o projeto inteiro. Abra só os arquivos que a tarefa toca.

## Regras de ouro

- Next.js 16 com Cache Components. Leia @AGENTS.md e o guia em `node_modules/next/dist/docs/` antes de usar uma API do Next que você não conhece.
- Um commit por alteração, em português: `feat:`, `fix:`, `refactor:`, `docs:`, `test:`, `chore:`.
- Mudou regra, estrutura ou tela? Atualize o arquivo de `context/` da área e o `estado-atual.md` no mesmo commit.
- Dados reais do cliente (planilhas, extratos, nomes de clientes) nunca entram no repositório.

## Comandos

`npm run dev` · `npm run typecheck` · `npm run lint` · `npm test` · `npm run build`

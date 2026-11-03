# Plano

Atualizado em 2026-11-02. Vale para todas as sessões. Ao terminar uma etapa, marque aqui e no `estado-atual.md`.

## O que a plataforma precisa ter

| Módulo | Funcionalidade | Situação |
|---|---|---|
| Base | Dados no banco (Neon + Drizzle), login, perfis de acesso | **Hoje** (E1, E2) |
| Base | Histórico de alterações (quem mudou o quê), multiempresa (Ambiente Legal) | Depois |
| Comercial | Proposta como fase 1 do processo: criar, documento para PDF, enviada, aprovada ou recusada; funil e retornos no Hoje | Pronto |
| Comercial | Enviar a proposta por e-mail pelo sistema, versões da proposta, modelos de texto editáveis | Depois |
| Prazos | Motor de prazos com regras da SVMA e feriados | Pronto |
| Prazos | Cadastrar e editar clientes e processos | **Hoje** (E3) |
| Prazos | Lançar evento manual (gera ou cumpre prazos), apagar evento errado | **Hoje** (E3) |
| Prazos | Regras de prazo e feriados como cadastro editável | Depois |
| Prazos | Alertas por e-mail (resumo diário, D-10, D-5, D-1) e calendário (.ics) | Depois (E7) |
| Diário Oficial | Caixa de entrada gravada: confirmar cria o evento; descartar com motivo; cadastrar processo a partir do ato | **Hoje** (E3) |
| Diário Oficial | Robô real: baixa a edição do DOC-SP, filtra a SVMA e vincula por nº SEI, nº SIMPROC e CNPJ | **Hoje** (E5) |
| Diário Oficial | Robô agendado todo dia útil às 6h, com alerta de falha; DJEN se houver processo judicial | Depois |
| Portal | Construtora entra com login e vê só os próprios processos | **Hoje** (E2) |
| Financeiro | Notas, contas a receber, DRE e fluxo (leitura) | Pronto |
| Financeiro | Registrar nota (inclusive a partir de parcela liberada), cancelar, registrar recebimento | Pronto (E4) |
| Financeiro | Lançamentos manuais (despesas e receitas) com conta, competência e processo | Pronto (E4) |
| Financeiro | Editar contrato e parcelas do processo | Pronto (E4) |
| Financeiro | Importar extrato (OFX/CSV), regras de classificação, fila "a classificar", conciliação nota × crédito | Pronto (E6) |
| Financeiro | Fatura do cartão item a item, fechamento do mês, margem por projeto, monitor do Simples | Depois (E8) |
| Financeiro | Importar o histórico real das planilhas; exportar Excel/PDF para o contador | Depois (E9) |

## Etapas

| Etapa | Entrega | Depende de | Sessão |
|---|---|---|---|
| E1 Fundação de dados ✅ | Schema Drizzle, conexão Neon, seed fictício no banco, `src/data/*` lendo do banco, kit de formulário (`src/components/ui/form.tsx`) | — | A |
| E2 Login e perfis ✅ | Login por e-mail e senha, perfis, menu e rotas por perfil, portal com usuário cliente, tela de usuários | E1 | A |
| E3 Edição de prazos ✅ | Clientes, processos, eventos, caixa de entrada gravada (testada no Neon) | E1 | B |
| E4 Edição financeira ✅ | Notas, recebimentos, lançamentos, contratos | E1 | C |
| E5 Robô do Diário Oficial ✅ | Coletor real do DOC-SP + botão "Buscar no Diário" gravando na caixa de entrada (testado com o site real e no Neon). Agendamento diário fica para depois | lógica: nada; gravação: E1 | B |
| E6 Extrato bancário ✅ | Importar OFX/CSV, regras de classificação, conciliação | lógica: nada; telas: E1 | C |
| E7 Alertas por e-mail | Resend, resumo diário e lembretes | E2 | depois |
| E8 Financeiro avançado | Cartão, fechamento mensal, margem por projeto, Simples | E4, E6 | depois |
| E9 Dados reais | Importar as planilhas da Eco Direito (fora do repositório), exportação | E4 | depois |

Critério de pronto de toda etapa: `npm run typecheck && npm run lint && npm test && npm run build` verdes, contexto da área atualizado, merge na `main`.

## Divisão de hoje (3 sessões)

### Sessão A: fundação e login (branch `feat/fundacao`, depois `feat/login`)

1. E1 e merge na `main` o quanto antes: é o que destrava B e C.
2. E2.
3. Revisar os merges de B e C, recriar o seed e conferir o deploy antes da reunião.

Pode mexer em: `src/db/**`, `src/data/base.ts`, `src/data/hoje.ts`, `src/lib/auth*`, `src/proxy.ts`, `src/app/(auth)/**`, `src/app/portal/**`, `src/components/layout/**`, `src/components/ui/**`, `src/app/(app)/page.tsx`, `package.json`.

### Sessão B: prazos e Diário Oficial (branch `feat/robo-doc-sp`, depois `feat/edicao-prazos`)

1. Antes da E1 chegar: E5, a parte que não precisa de banco. Coletor do DOC-SP em `src/robo/doc-sp.ts` (download da edição, filtro da SVMA, conversão para `Ato`), com testes usando um arquivo de exemplo.
2. Com a E1 na `main`: E3, e depois gravar o resultado do robô na caixa de entrada.

Pode mexer em: `src/domain/prazos.ts`, `src/domain/processos.ts`, `src/domain/publicacoes.ts`, `src/robo/**`, `src/data/processos.ts`, `src/data/publicacoes.ts`, `src/app/(app)/prazos/**`, `src/app/(app)/processos/**`, `src/app/(app)/publicacoes/**`, `src/app/api/robo/**`.

### Sessão C: financeiro (branch `feat/extrato`, depois `feat/edicao-financeira`)

1. Antes da E1 chegar: E6, a parte que não precisa de banco. Leitor de OFX e CSV e motor de regras de classificação em `src/domain/financeiro/extrato.ts` e `classificacao.ts`, com testes.
2. Com a E1 na `main`: E4, e depois a tela de importação do extrato.

Pode mexer em: `src/domain/financeiro/**`, `src/data/financeiro.ts`, `src/app/(app)/financeiro/**`.

## Regras para trabalhar em paralelo

- **Cada sessão no seu worktree**, dentro de `.claude/worktrees/` (ignorado pelo git). A pasta principal fica sempre na `main`, só para merge e push. Para começar: `git worktree add .claude/worktrees/sessao-b -b feat/robo-doc-sp main`, entrar nele (ferramenta EnterWorktree com `path`), `npm install` e copiar o `.env.local` da pasta principal.
- **Só mexa nos arquivos da sua sessão.** Precisa de um arquivo de outra sessão? Anote em "Pedidos entre sessões", abaixo, e siga com outra tarefa.
- **Schema e banco:** B e C podem **acrescentar tabelas novas** no schema da sua área (B: `src/db/schema/publicacoes.ts`; C: `src/db/schema/financeiro.ts`). Para mudar uma tabela que já existe, peça à A por mensagem. Só a A roda `db:push` e `db:seed`, depois do merge na `main`.
- **Comunicação:** as sessões conversam por mensagem (ecodireito-2a = C, ecodireito-32 = B). Avise ao fazer merge na `main` e ao pedir algo de outra sessão.
- **Merge:** com a etapa pronta, `git merge main` na sua branch, rode as checagens e depois `git -C <pasta principal> merge --no-ff <sua-branch>`. O usuário faz o push (o push é bloqueado para o Claude).
- **Segurança:** guarda em layout não protege dados (o Next renderiza layout e página em paralelo). Toda leitura passa por `carregar()`, que já recorta por perfil, ou começa com `exigirArea()`. Toda Server Action começa com `exigirArea(area, 'editar')`.
- **Contexto:** cada sessão atualiza o arquivo de `context/` da sua área e a sua linha da tabela "Etapas" deste arquivo.

## Pedidos entre sessões

| De | Para | Pedido | Feito |
|---|---|---|---|
| C | B | Em `/processos/[id]`, no card de parcelas, para quem edita o financeiro: link "Editar parcelas" para `/financeiro/contratos/[id]` e, na parcela pronta para faturar, "Registrar nota" para `/financeiro/notas/nova?parcela=<id>`. | |
| B | A | `publicacoes.link`, `edicoes_diario.erro` e unique (data, documento) para o robô não duplicar | sim (feat/fundacao) |

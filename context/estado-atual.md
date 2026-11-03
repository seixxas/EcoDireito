# Estado atual

Atualizado em 2026-11-03. Os dados ficam no banco Neon (base fictícia gravada pelo `npm run db:seed`) e todo acesso exige login.
Sem `DATABASE_URL`, o app usa os dados em memória e entra direto como sócia de demonstração.

## Pronto

| Rota | Tela | O que mostra |
|---|---|---|
| `/login` | Login | E-mail e senha; cada perfil cai na sua tela inicial |
| `/` | Hoje | Lista por urgência (atrasado, hoje, próximos 7 dias): prazos, publicações a revisar, parcelas a faturar, notas atrasadas; ao lado, saldo e Diário |
| `/prazos` | Prazos | Prazos em aberto por período (vencidos, esta semana, próximas semanas, mais adiante), cálculo recolhido; `?filtro=orgao` e `?filtro=cumpridos`; busca (`?q=`) e filtro por responsável; 10 por página |
| `/processos` | Processos | Lista com fase e próximo prazo; cadastrar processo (`/processos/novo`) |
| `/processos/[id]` | Processo | Barra de fases e abas `?aba=` Prazos, Linha do tempo (lançar e apagar evento) e Cobrança (parcelas, "Emitir nota"); editar em `/processos/[id]/editar` |
| `/processos/clientes` | Clientes | Lista com busca por nome, CNPJ e grupo; cadastro e edição de clientes |
| `/publicacoes` | Diário Oficial | Caixa de entrada: atos achados por nº SEI, nº SIMPROC ou CNPJ; busca no texto, empresa e nº SEI; confirmar cria o evento, descartar pede motivo, cadastrar processo a partir do ato |
| `/financeiro` | Faturamento | Notas, situação, faturado × recebido, parcelas prontas para faturar |
| `/financeiro/receber` | Contas a receber | Atraso por faixa e por grupo econômico |
| `/financeiro/dre` | DRE | Caixa ou competência (`?regime=competencia`) |
| `/financeiro/fluxo` | Fluxo de caixa | Projeção de 8 semanas e realizado por mês |
| `/financeiro/notas/nova` | Registrar nota | Nota avulsa ou a partir de parcela liberada (`?parcela=`) |
| `/financeiro/notas/[id]` | Nota fiscal | Detalhe, registrar ou corrigir recebimento, cancelar |
| `/financeiro/lancamentos` | Lançamentos | Lista por mês e lançamento manual com conta, competência e processo |
| `/financeiro/contratos` | Contratos | Parcelas por processo; `/[processoId]` inclui, edita e apaga |
| `/financeiro/extrato` | Extrato bancário | Importa OFX/CSV; fila a classificar com sugestão (já lançado, recebimento de nota, regra); regras |
| `/usuarios` | Usuários | Sócias criam e removem acessos (equipe, contador, cliente) |
| `/portal` e `/portal/[id]` | Portal do cliente | O cliente entra e vê só os próprios processos |

- Modo escuro (botão lua/sol no pé do menu), menu verde e paginação de 10 itens (`src/lib/paginar.ts`).
- Redesign no ar desde 03/11 (guia em `context/interface.md`): Hoje, prazos, processo em abas, Diário, financeiro, portal, login e usuários.
- Perfis (`src/lib/permissoes.ts`): sócia, financeiro, equipe, contador e cliente. O recorte do que cada um vê fica em `carregar()` (`src/data/base.ts`).
- Domínio com testes (`npm test`); build de produção passando (`npm run build`).

## Para apresentar

- No ar: https://eco-direito.vercel.app (Vercel do Guilherme, deploy automático a cada push na `main`).
- Local: `npm run dev` e abrir http://localhost:3000.
- Usuários de demonstração (senha em `SENHA_DEMO` do `.env.local`): `admin@`, `elaine@`, `karim@`, `cissa@` (sócias), `juliana@` (equipe), `contador@` e `cliente@` (portal da Altavista Pinheiros), todos `@demo.ecodireito.com.br`.
- Antes da reunião: `npm run db:seed` refaz a base com as datas do dia (apaga o que foi editado e recria os usuários).
- Roteiro testado em 03/11 no site e de novo no visual novo (navegador real, gravando no Neon): confirmar o Extrato do TCA do Jequitibá Campo Belo em `/publicacoes` → prazo da cláusula 9.3 em `/processos/p11` e parcela 3 "pronta para faturar" na aba Cobrança → "Emitir nota" → registrar recebimento → importar `docs/demo/extrato-demo.ofx` em `/financeiro/extrato` (2 linhas "já lançado", o PIX sugere a NF 729, 2 a classificar). O extrato de exemplo vale para a base gerada em 03/11.
- Login em produção: no máximo 3 tentativas a cada 10 s por IP (proteção do Better Auth).
- Bons exemplos: `/processos/p02` (TCA publicado, parcela pronta para faturar), `/processos/p13` (processo antigo com nº SIMPROC) e o portal com o usuário cliente.

## Próximos passos

Veja `context/plano.md` (etapas E3 a E9 e a divisão entre as sessões).

## Pendências com a Eco Direito

Lista viva na seção "Pendências" do escopo: https://claude.ai/artifact/DcoEDtPMamJWQtwEfL25FH

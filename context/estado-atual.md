# Estado atual

Atualizado em 2026-11-02. Os dados ficam no banco Neon (base fictícia gravada pelo `npm run db:seed`) e todo acesso exige login.
Sem `DATABASE_URL`, o app usa os dados em memória e entra direto como sócia de demonstração.

## Pronto

| Rota | Tela | O que mostra |
|---|---|---|
| `/login` | Login | E-mail e senha; cada perfil cai na sua tela inicial |
| `/` | Painel | Prazos vencidos e próximos, Diário Oficial, parcelas a faturar (com "Emitir nota"), notas atrasadas, saldo |
| `/prazos` | Prazos | Todos os prazos com cálculo explicado; filtros na URL (`?filtro=vencidos`) |
| `/processos` | Processos | Lista com fase e próximo prazo; cadastrar processo (`/processos/novo`) |
| `/processos/[id]` | Processo | 7 fases, prazos, linha do tempo (lançar e apagar evento) e parcelas do contrato; editar em `/processos/[id]/editar` |
| `/processos/clientes` | Clientes | Lista, cadastro e edição de clientes |
| `/publicacoes` | Diário Oficial | Caixa de entrada: atos achados por nº SEI, nº SIMPROC ou CNPJ; confirmar cria o evento, descartar pede motivo, cadastrar processo a partir do ato |
| `/financeiro` | Faturamento | Notas, situação, faturado × recebido, parcelas prontas para faturar |
| `/financeiro/receber` | Contas a receber | Atraso por faixa e por grupo econômico |
| `/financeiro/dre` | DRE | Caixa ou competência (`?regime=competencia`) |
| `/financeiro/fluxo` | Fluxo de caixa | Projeção de 8 semanas e realizado por mês |
| `/financeiro/notas/nova` | Registrar nota | Nota avulsa ou a partir de parcela liberada (`?parcela=`) |
| `/financeiro/notas/[id]` | Nota fiscal | Detalhe, registrar ou corrigir recebimento, cancelar |
| `/financeiro/lancamentos` | Lançamentos | Lista por mês e lançamento manual com conta, competência e processo |
| `/financeiro/contratos` | Contratos | Parcelas por processo; `/[processoId]` inclui, edita e apaga |
| `/usuarios` | Usuários | Sócias criam e removem acessos (equipe, contador, cliente) |
| `/portal` e `/portal/[id]` | Portal do cliente | O cliente entra e vê só os próprios processos |

- Perfis (`src/lib/permissoes.ts`): sócia, financeiro, equipe, contador e cliente. O recorte do que cada um vê fica em `carregar()` (`src/data/base.ts`).
- Domínio com testes (`npm test`); build de produção passando (`npm run build`).

## Para apresentar

- No ar: https://eco-direito.vercel.app (Vercel do Guilherme, deploy automático a cada push na `main`).
- Local: `npm run dev` e abrir http://localhost:3000.
- Usuários de demonstração (senha em `SENHA_DEMO` do `.env.local`): `elaine@`, `karim@`, `cissa@` (sócias), `juliana@` (equipe), `contador@` e `cliente@` (portal da Altavista Pinheiros), todos `@demo.ecodireito.com.br`.
- Antes da reunião: `npm run db:seed` refaz a base com as datas do dia (apaga o que foi editado e recria os usuários).
- Bons exemplos: `/processos/p02` (TCA publicado, parcela pronta para faturar), `/processos/p13` (processo antigo com nº SIMPROC) e o portal com o usuário cliente.

## Próximos passos

Veja `context/plano.md` (etapas E3 a E9 e a divisão entre as sessões).

## Pendências com a Eco Direito

Lista viva na seção "Pendências" do escopo: https://claude.ai/artifact/DcoEDtPMamJWQtwEfL25FH

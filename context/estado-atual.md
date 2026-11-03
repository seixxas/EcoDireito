# Estado atual

Atualizado em 2026-11-02. Tudo roda com dados fictícios em memória (`src/data/seed`) e é só leitura.

## Pronto

| Rota | Tela | O que mostra |
|---|---|---|
| `/` | Painel | Prazos vencidos e próximos, Diário Oficial, parcelas a faturar, notas atrasadas, saldo |
| `/prazos` | Prazos | Todos os prazos com cálculo explicado; filtros na URL (`?filtro=vencidos`) |
| `/processos` | Processos | Lista com fase e próximo prazo; cadastrar processo (`/processos/novo`) |
| `/processos/[id]` | Processo | 7 fases, prazos, linha do tempo (lançar e apagar evento) e parcelas do contrato; editar em `/processos/[id]/editar` |
| `/processos/clientes` | Clientes | Lista, cadastro e edição de clientes |
| `/publicacoes` | Diário Oficial | Caixa de entrada: atos achados por nº SEI, nº SIMPROC ou CNPJ; confirmar cria o evento, descartar pede motivo, cadastrar processo a partir do ato |
| `/financeiro` | Faturamento | Notas, situação, faturado × recebido, parcelas prontas para faturar |
| `/financeiro/receber` | Contas a receber | Atraso por faixa e por grupo econômico |
| `/financeiro/dre` | DRE | Caixa ou competência (`?regime=competencia`) |
| `/financeiro/fluxo` | Fluxo de caixa | Projeção de 8 semanas e realizado por mês |
| `/portal/[id]` | Portal do cliente | O mockup original, agora com dados do processo |

- Domínio com testes: motor de prazos, feriados, notas, DRE, fluxo e vínculo de publicações (`npm test`).
- Build de produção passando (`npm run build`).

## Para apresentar

- No ar: https://eco-direito.vercel.app (Vercel do Guilherme, deploy automático a cada push na `main`).
- Local: `npm run dev` e abrir http://localhost:3000.
- Para congelar a data, crie `.env.local` com `DATA_DEMO=AAAA-MM-DD` (os dados são gerados a partir dela).
- Bons exemplos: `/processos/p02` (TCA publicado, parcela pronta para faturar), `/processos/p13` (processo antigo com nº SIMPROC) e `/portal/p01`.

## Próximos passos

1. Ligar o banco Neon (já criado e conectado ao projeto na Vercel, variáveis em `DATABASE_URL`) com Drizzle, carregar o seed nele e pôr login com perfis (sócias, financeiro, equipe, contador, cliente).
2. Lançar e editar pela tela: eventos, notas, recebimentos, lançamentos.
3. Importar extrato (OFX/CSV) e regras de classificação.
4. Robô do Diário Oficial (coletor diário do DOC-SP) gravando na caixa de entrada.
5. Alertas por e-mail (resumo diário e D-10, D-5, D-1).

## Pendências com a Eco Direito

Lista viva na seção "Pendências" do escopo: https://claude.ai/artifact/DcoEDtPMamJWQtwEfL25FH

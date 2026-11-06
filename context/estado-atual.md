# Estado atual

Atualizado em 2026-11-05. Os dados ficam no banco Neon (base fictícia gravada pelo `npm run db:seed`) e todo acesso exige login.
Sem `DATABASE_URL`, o app usa os dados em memória e entra direto como sócia de demonstração.

## Pronto

| Rota | Tela | O que mostra |
|---|---|---|
| `/login` | Login | E-mail e senha; cada perfil cai na sua tela inicial |
| `/` | Hoje | Lista por urgência (atrasado, hoje, próximos 7 dias): prazos, publicações a revisar, parcelas a faturar, notas atrasadas; ao lado, saldo e Diário |
| `/prazos` | Prazos | Prazos em aberto por período (vencidos, esta semana, próximas semanas, mais adiante), cálculo recolhido; `?filtro=orgao` e `?filtro=cumpridos`; busca (`?q=`) e filtro por responsável; 10 por página |
| `/projetos` | Processos | Lista com fase e próximo prazo; busca (`?q=`) e filtro por fase (`?fase=`); cadastrar processo (`/projetos/novo`) |
| `/projetos/[id]` | Processo | Barra das 8 fases clicável (`?aba=etapas&fase=`) e abas: Proposta (documento para imprimir; enviada, aprovada, recusada), Etapas (checklist da fase, "Marcar como feita" com observação), Prazos, Linha do tempo (apagar evento) e Cobrança (parcelas, "Emitir nota"); editar em `/projetos/[id]/editar` |
| `/comercial` | Comercial | Funil de propostas (em elaboração, enviadas, aprovadas, recusadas) com valor em aberto, conversão e quem pede retorno; "Nova proposta" em `/comercial/nova`, em 3 passos só na tela (um formulário só; "Cadastrar novo cliente" volta para a proposta com o cliente escolhido) |
| `/comercial/prospeccao` | Prospecção | Em desenvolvimento: prévia com oportunidades de exemplo (alvarás novos, SPEs de grupos clientes, terrenos com vegetação) |
| `/projetos/clientes` | Clientes | Lista com busca por nome, CNPJ e grupo; cadastro e edição de clientes |
| `/publicacoes` | Diário Oficial | Caixa de entrada: atos achados por nº SEI, nº SIMPROC ou CNPJ; busca no texto, empresa e nº SEI; separa atos de processos acompanhados e de clientes sem processo, diz por que cada ato está ali; "Lançar no processo" marca a etapa, "Cadastrar o processo e lançar" cria o processo e já lança, "Ignorar" pergunta antes e pede motivo; abas Para revisar, Lançados e Ignorados |
| `/financeiro` | Faturamento | Abas do ciclo (`?aba=`): A faturar, A vencer, Vencem hoje, Atrasadas (faixas e ordem), Recebidas e Todas (com seletor de mês), cada uma com quantidade e valor; busca, botões na linha e painel lateral da nota (`?nota=`, `&acao=receber`, `&acao=cobrar`). `/financeiro/receber` redireciona para a aba Atrasadas |
| `/financeiro/lucratividade` | Lucratividade por projeto | Simulação com busca, filtro de margem e paginação; detalhe em `/[processoId]` |
| `/financeiro/faturado-recebido` | Faturado × recebido | Gráfico por mês e tabela com os mesmos números, com link no Faturamento |
| `/financeiro/dre` | DRE | Grade no modelo da planilha: realizado por mês, contas e período (com % da receita líquida) travados; blocos que abrem, caixa ou competência, período (completo, meses fechados, trimestre), lançamentos abaixo da tabela e "Exportar para Excel" |
| `/financeiro/fluxo` | Fluxo de caixa | Projeção de 8 semanas (clicar numa semana mostra dia a dia, `?semana=`) e realizado por mês |
| `/financeiro/notas/nova` | Registrar nota | Nota avulsa ou a partir de parcela liberada (`?parcela=`) |
| `/financeiro/notas/[id]` | Nota fiscal | Detalhe, registrar ou corrigir recebimento, cancelar |
| `/financeiro/lancamentos` | Lançamentos | Lista por mês (ou todos) com busca e filtro de conta; lançamento manual; `/[id]` edita descrição, conta, competência, processo e observação |
| `/financeiro/contratos` | Contratos | Parcelas por processo; `/[processoId]` inclui, edita e apaga |
| `/financeiro/extrato` | Extrato bancário | Importa OFX/CSV; fila a classificar com sugestão (já lançado, recebimento de nota, regra); regras |
| `/usuarios` | Usuários | Sócias criam acessos (`?novo=1` abre o formulário) e removem, com confirmação (equipe, contador, cliente). O Comercial aparece para sócias, financeiro e equipe; não para contador e cliente |
| `/portal` e `/portal/[id]` | Portal do cliente | O cliente entra e vê só os próprios processos |

- Navegação "caixa única" (04/11): menu com Hoje, Propostas, Processos e Financeiro, busca geral (`/busca`, Ctrl+K), botão "Novo", atalhos fixados e abas no topo de cada área. Guia em `context/interface.md`. Falta o "Adiar" na lista Para fazer, que precisa de tabela nova.
- Modo escuro (botão "Tema escuro" no pé do menu) e paginação de 10 itens (`src/lib/paginar.ts`).
- Processos em 8 fases (Proposta antes da Documentação), cada uma com as suas etapas; o LAA fecha a fase Resposta, depois do Comunique-se. Processo novo nasce sem nº SEI. Veja `context/prazos.md`.
- Visual Parque + Semáforo (05/11), para pessoas com mais de 60 anos: letra e botões grandes, tudo escrito, blocos coloridos pela urgência. Guia em `context/interface.md`.
- Navegação rápida: telas guardadas só no navegador por 60 segundos e preparadas com o mouse em cima (`arquitetura.md`, "Velocidade da navegação").
- Perfis (`src/lib/permissoes.ts`): sócia, financeiro, equipe, contador e cliente. O recorte do que cada um vê fica em `carregar()` (`src/data/base.ts`).
- Domínio com testes (`npm test`); build de produção passando (`npm run build`).

## Para apresentar

- No ar: https://eco-direito.vercel.app (Vercel do Guilherme, deploy automático a cada push na `main`).
- Local: `npm run dev` e abrir http://localhost:3000.
- Usuários de demonstração (senha em `SENHA_DEMO` do `.env.local`): `admin@`, `elaine@`, `karim@`, `cissa@` (sócias), `juliana@` (equipe), `contador@` e `cliente@` (portal da Altavista Pinheiros), todos `@demo.ecodireito.com.br`.
- Antes da reunião: `npm run db:seed` refaz a base com as datas do dia (apaga o que foi editado e recria os usuários).
- Roteiro testado em 03/11 no site e de novo no visual novo (navegador real, gravando no Neon): confirmar o Extrato do TCA do Jequitibá Campo Belo em `/publicacoes` → prazo da cláusula 9.3 em `/projetos/p11` e parcela 3 "pronta para faturar" na aba Cobrança → "Emitir nota" → registrar recebimento → em `/financeiro/extrato`, "baixar extrato de exemplo" e importar o arquivo (2 linhas "já lançado", o PIX recebido sugere a NF em aberto do mesmo valor, o PIX enviado e a tarifa ficam a classificar). O exemplo é montado da base do dia, então bate com qualquer seed.
- Login em produção: no máximo 3 tentativas a cada 10 s por IP (proteção do Better Auth).
- Bons exemplos: `/projetos/p06` (fase Resposta: Comunique-se vencido, LAA depois da resposta), `/projetos/p15` (proposta enviada, sem nº SEI), `/projetos/p16` (proposta em elaboração), `/projetos/p17` (sem resposta há 12 dias, aparece no Hoje), `/projetos/p18` (recusada), `/projetos/p08` (Documentação, falta autuar), `/projetos/p02` (TCA publicado, parcela pronta para faturar), `/projetos/p13` (processo antigo com nº SIMPROC) e o portal com o usuário cliente.

## Próximos passos

Veja `context/plano.md` (etapas E3 a E9 e a divisão entre as sessões).

## Pendências com a Eco Direito

Lista viva na seção "Pendências" do escopo: https://claude.ai/artifact/DcoEDtPMamJWQtwEfL25FH

# Decisões

Registro curto, do mais novo para o mais antigo. Mudou uma decisão? Acrescente uma linha nova; não apague a antiga.

| Data | Decisão | Por quê |
|---|---|---|
| 2026-11-06 | Banco trocado de Neon (Postgres) e Drizzle para MongoDB Atlas com o driver oficial. Uma coleção por tabela antiga, ids em texto, base fictícia refeita pelo seed. Substitui as decisões de 02/11 sobre Neon e Drizzle | A cota do Neon estourou e derrubou o login do site. Pedido do dono do produto, com a conta paga do Atlas já disponível. As assinaturas de `src/data` não mudaram; vínculos, cascatas e duplicidade passaram para o código e para os índices |
| 2026-11-06 | Visual compacto: letra de 15 px, botão de 36 px (28 px em linha), tabelas e listas em linhas corridas, formulários em colunas e Propostas em colunas. Substitui a escala de 05/11; ficam a fonte, as cores e o tudo escrito | Com a escala para mais de 60 anos, as telas ficaram 2 a 2,5 vezes mais altas e a rolagem atrapalhou. Pedido do dono do produto: intuitivo e fácil, em tamanho normal |
| 2026-11-05 | Visual Parque + Semáforo: letra de 19 px, botões de 52 px, fonte Atkinson Hyperlegible Next, menu claro, blocos coloridos pela urgência e tudo escrito, sem ícones | Quem usa tem mais de 60 anos, e o visual anterior tinha a cara padrão de interface gerada por IA. Desenho feito no Claude Design. Só a aparência mudou; a confirmação antes de apagar é a única novidade de comportamento, e fica no navegador. Substitui a identidade de 03/11 |
| 2026-11-05 | Na tela, "Processos" virou "Projetos"; `/processos` redireciona para `/projetos` | Pedido do dono do produto: a lucratividade por projeto é o trabalho como um todo. "Processo" fica só para o processo oficial na SVMA. O redirecionamento não é permanente de propósito, para não ficar preso no navegador se o nome mudar. Código e banco seguem como `processo`: renomear o banco é mudança de schema e não muda nada para quem usa |
| 2026-11-05 | Uma fronteira de carregamento só, no layout de `(app)`; saem os `loading.tsx` das rotas. Substitui a decisão de 02/11 | No site, com a resposta em cerca de 150 ms, o clique ainda levava 330 ms: o React segura um esqueleto por pelo menos 300 ms. Sem esqueleto na navegação, a tela troca direto. O aviso de espera longa virou uma barra fina (`useLinkStatus`) |
| 2026-11-05 | Funções da Vercel em `gru1`, junto do Neon | Rodavam em Washington e o banco fica em São Paulo: 13 consultas por clique atravessando o continente, cerca de 1 segundo por clique |
| 2026-11-05 | Telas guardadas só no navegador (`use cache: private`, 60 s) e preparadas com o mouse em cima (`LinkRapido`) | Cache de dados no servidor (`use cache: remote`) foi descartado: exigiria invalidar 26 pontos de gravação, as validações das ações leriam dado velho, o `db:seed` não invalidaria nada e haveria uma cópia do financeiro no cache da Vercel. Com o servidor perto do banco, quase não renderia. O preço aceito: o que outra pessoa gravou aparece em até 60 segundos, ou com F5 |
| 2026-11-05 | `cookieCache` do Better Auth continua desligado | Com ele, usuário removido seguiria lendo e gravando por alguns minutos, para ganhar pouco depois da mudança de região |
| 2026-11-04 | DRE sem meta por enquanto, nem de exemplo: só o realizado e o % da receita líquida | Decisão do dono do produto. Substitui a meta de exemplo. Quando a Eco Direito definir metas, entram com tabela nova e tela de edição |
| 2026-11-04 | DRE copia a grade da planilha do Ecoamper, com as contas da Eco Direito | Pedido do dono do produto. A forma vem de lá; contas, nomes e os dois regimes continuam os que a Eco Direito usa |
| 2026-11-04 | Meta de exemplo calculada dos lançamentos, sem tabela nova | A Eco Direito não tem meta cadastrada e tabela nova pede aprovação. A tela avisa que é exemplo |
| 2026-11-04 | Quadro de lançamentos por `?linha=&mes=` na própria página, sem API | Os dados já vêm em `carregar()`; igual ao painel da nota |
| 2026-11-04 | Telas na largura toda e fonte 6% maior a partir de 1600 px | Pedido do dono do produto: o conteúdo ficava pequeno e no centro. Em rem, tudo cresce junto com uma linha de CSS |
| 2026-11-04 | Navegação "caixa única": 4 itens no menu, abas dentro de cada área, busca geral e botão Novo | Escolha do dono do produto entre três caminhos (referências: Karbon, Linear, Stripe). O que precisa de alguém deixa de morar em três telas e o menu cai de 13 itens para 4 |
| 2026-11-04 | Busca geral numa página (`/busca`), sem lista suspensa enquanto digita | Menos código, funciona sem JavaScript e reaproveita as listas |
| 2026-11-04 | Fixados no `localStorage` | É conveniência de cada pessoa, não dado do escritório; não pede tabela nova |
| 2026-11-04 | Painel da nota por `?nota=` na própria página do Faturamento, com `obterNota`, sem rota paralela | Mantém aba, busca e filtros na mesma URL e não exige mexer no layout do financeiro. Abrir o painel e trocar de aba não piscam: o Next mantém a lista até a resposta chegar |
| 2026-11-04 | `/financeiro/receber` é um Route Handler que só redireciona | Devolve um 307 de verdade e dispensa página e `loading.tsx` |
| 2026-11-02 | Login com Better Auth (e-mail e senha, sem cadastro aberto), perfis em `src/lib/permissoes.ts` | Roda no nosso Postgres e vai junto para a hospedagem oficial; sem serviço externo |
| 2026-11-02 | Recorte por perfil em `carregar()`, não só no layout | Layout e página renderizam em paralelo: a guarda do layout não impede a página de mandar dados |
| 2026-11-02 | `BETTER_AUTH_URL` só na Vercel; no local, o endereço vem da requisição | Cada sessão roda numa porta diferente |
| 2026-11-02 | Drizzle com driver HTTP do Neon; `drizzle-kit push` sem arquivos de migração por enquanto | Três sessões em paralelo: migrações numeradas iam conflitar. Adotar migrações antes da produção |
| 2026-11-02 | `carregar()` lê a base inteira do banco a cada requisição (com `cache` do React) | Volume pequeno; mantém todas as funções de `src/data` iguais. Otimizar por consulta quando crescer |
| 2026-11-02 | Zod para validar formulários | Validação e tipos num lugar só, padrão com Server Actions |
| 2026-11-02 | Demonstração na Vercel com banco Neon (Postgres), no lugar do Supabase previsto | Rápido de subir na conta já ligada ao GitHub; a hospedagem oficial ainda vai ser definida |
| 2026-11-02 | Um `loading.tsx` por rota e `<Suspense>` no menu lateral | Validação de navegação instantânea do Next 16 exige fronteira por segmento |
| 2026-11-02 | Gráficos com `responsive` do Recharts 3, sem `ResponsiveContainer` | Mais simples e usa CSS padrão |
| 2026-11-02 | Confirmar publicação e emitir nota são só visuais por enquanto | Sem banco, nada persiste; a tela já mostra o fluxo |
| 2026-11-02 | Componentes de UI próprios e mínimos, sem shadcn/ui | Poucas peças necessárias; menos arquivos e dependências |
| 2026-11-02 | Recharts para gráficos e lucide-react para ícones | Padrão de mercado, leves, só no cliente |
| 2026-11-02 | Dinheiro em centavos inteiros; datas como `'AAAA-MM-DD'` | Evita erro de arredondamento e de fuso |
| 2026-11-02 | Dados fictícios em memória, atrás de `src/data` | Demonstração rápida; o banco entra sem mexer nas telas |
| 2026-11-02 | Cache Components mantido (padrão do Next 16) | Data de hoje via `connection()`, páginas dentro do Suspense do `loading.tsx` |
| 2026-11-02 | Regras de prazo no código (`REGRAS_SVMA`) por enquanto | Viram cadastro editável quando o banco entrar |
| 2026-11-02 | Contexto em `context/`, com `CLAUDE.md` só apontando caminhos | Várias sessões; cada uma lê só a área que vai mexer |

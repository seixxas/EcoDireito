# Decisões

Registro curto, do mais novo para o mais antigo. Mudou uma decisão? Acrescente uma linha nova; não apague a antiga.

| Data | Decisão | Por quê |
|---|---|---|
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

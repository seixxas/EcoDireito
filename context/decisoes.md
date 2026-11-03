# Decisões

Registro curto, do mais novo para o mais antigo. Mudou uma decisão? Acrescente uma linha nova; não apague a antiga.

| Data | Decisão | Por quê |
|---|---|---|
| 2026-11-02 | Componentes de UI próprios e mínimos, sem shadcn/ui | Poucas peças necessárias; menos arquivos e dependências |
| 2026-11-02 | Recharts para gráficos e lucide-react para ícones | Padrão de mercado, leves, só no cliente |
| 2026-11-02 | Dinheiro em centavos inteiros; datas como `'AAAA-MM-DD'` | Evita erro de arredondamento e de fuso |
| 2026-11-02 | Dados fictícios em memória, atrás de `src/data` | Demonstração rápida; o banco entra sem mexer nas telas |
| 2026-11-02 | Cache Components mantido (padrão do Next 16) | Data de hoje via `connection()`, páginas dentro do Suspense do `loading.tsx` |
| 2026-11-02 | Regras de prazo no código (`REGRAS_SVMA`) por enquanto | Viram cadastro editável quando o banco entrar |
| 2026-11-02 | Contexto em `context/`, com `CLAUDE.md` só apontando caminhos | Várias sessões; cada uma lê só a área que vai mexer |

# Dados fictícios (demonstração)

Arquivos: `src/data/seed/*`. Todo dado é inventado, mas segue os padrões das planilhas reais
para a demonstração fazer sentido.

## Regras

- Nada real: nomes de clientes, CNPJs, valores e números de processo são inventados.
- Exceção: os nomes das sócias (Elaine, Karim, Cissa), porque elas são as usuárias.
- Gerador determinístico (`src/data/seed/aleatorio.ts`): a mesma semente sempre gera os mesmos dados.
- Datas relativas a hoje (`dias(-12)`), para a demonstração parecer viva em qualquer dia.
- O histórico financeiro começa em janeiro do ano corrente.

## O que imita o real

- Clientes: SPEs agrupadas por incorporadora, mais alguns clientes avulsos e pessoas físicas.
- Notas: valores, nota extra de R$ 1.000, retenção de 5,5%, ISS de 5%, prazo de recebimento e atrasos.
- Despesas: as mesmas contas e ordens de grandeza (aluguel, TI, contabilidade, prestadores de manejo, ART, cartão).
- Saldo: começa perto de R$ 260 mil, e aplicações e resgates mantêm o caixa positivo.
- Processos: 14, espalhados pelas 7 fases, com prazos vencidos, para hoje, próximos e cumpridos.

## Para mudar a demonstração

- Novos casos de prazo: `src/data/seed/processos.ts`.
- Publicações da caixa de entrada: `src/data/seed/publicacoes.ts`.
- Volume e valores financeiros: constantes no topo de `src/data/seed/financeiro.ts`.

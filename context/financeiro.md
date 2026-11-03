# Financeiro

Arquivos: `src/domain/financeiro/*`, `src/data/financeiro.ts`, `src/app/(app)/financeiro/*`.
Análise das planilhas reais: aba "Análise das planilhas" do escopo (https://claude.ai/artifact/DcoEDtPMamJWQtwEfL25FH).

## Entidades

- **Nota fiscal**: nº, emissão, cliente, processo e parcela (opcional), valor, ISS (5%), retenção na fonte, previsão e recebimento.
- **Contrato e parcelas**: cada processo tem um contrato. A parcela nasce de um evento do processo:
  - Licenciamento: 3 parcelas (aceite da proposta, emissão do LAA, publicação do TCA).
  - Manejo: 50% na entrada e 50% no término do corte.
- **Lançamento**: entrada ou saída de caixa com data, competência (`AAAA-MM`), conta do plano de contas e, se houver, processo e nota.

## Situações (calculadas, nunca digitadas)

- Nota: `cancelada` · `recebida` · `parcial` · `atrasada` (previsão passou) · `a_receber`.
- Parcela: `aguardando` (evento não aconteceu) · `liberada` (evento aconteceu, sem nota) · `faturada` · `recebida`.

## DRE (estrutura que a Eco Direito já usa)

Receita bruta → (−) Simples Nacional → Receita líquida → (−) Custos (ART, serviços de terceiros, equipamentos)
→ Lucro bruto → (−) 20 despesas operacionais → Resultado operacional → (±) Financeiro → (+) Outras receitas
→ Resultado líquido → Fora da DRE (distribuição de lucros, mútuo, aplicações, imobilizado) → Variação de caixa.

- **Caixa**: tudo pela data do dinheiro.
- **Competência**: receita pela emissão da nota; o resto pela competência do lançamento.
- Plano de contas em `src/domain/financeiro/plano-de-contas.ts`.

## Fluxo de caixa

- Realizado: soma dos lançamentos por mês, com o saldo.
- Projetado (8 semanas): notas a receber pela previsão, parcelas liberadas (emissão + 20 dias) e despesas recorrentes.
- Notas atrasadas ficam fora da projeção (conservador) e aparecem à parte.

## Fatos das planilhas reais (jan–set/2026) que guiam o produto

- Cerca de 19 notas por mês, nota mediana de R$ 7 mil; prazo mediano até receber: 17 dias.
- 28 notas de R$ 1.000 emitidas junto com outra nota do mesmo cliente (natureza a confirmar).
- 66 notas com retenção de 5,5% na fonte.
- DAS pago ≈ 15,6% do faturado; ISS pago por guia separada desde abril (sublimite do Simples, a confirmar).

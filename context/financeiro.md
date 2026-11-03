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

## Edição

| Tela | O que faz |
|---|---|
| `/financeiro/notas/nova` | Registra a nota já emitida no site da Prefeitura. Com `?parcela=<id>` (botão "Registrar nota" da parcela liberada), já liga cliente, processo e parcela. |
| `/financeiro/notas/[id]` | Detalhe da nota; registrar ou corrigir o recebimento; cancelar. |
| `/financeiro/lancamentos` | Lançamentos do mês e lançamento manual (despesa ou receita) com conta, competência e processo. |
| `/financeiro/contratos` | Contratado, faturado e a faturar por processo. `/financeiro/contratos/[processoId]` inclui, edita e apaga parcelas. |

Regras (em `src/domain/financeiro/notas.ts` e `lancamentos.ts`, com teste):

- ISS de 5% sobre o valor; retenção na fonte de 5,5% quando marcada. A previsão sugerida é a emissão + 15 dias.
- O número da NF não se repete. A previsão não pode ser antes da emissão. O processo tem de ser do mesmo cliente. Cada parcela tem uma nota só (nota cancelada não conta).
- Um recebimento por nota, com data entre a emissão e hoje. Registrar o recebimento cria o lançamento de receita (`receita_servicos`, com `notaId`); registrar de novo substitui os dois.
- Só se cancela nota sem recebimento.
- Lançamento manual: valor diferente de zero e data até hoje (o previsto vem da projeção do fluxo). Competência vazia = mês da data. O lançamento de uma nota não se apaga pela lista; muda pela nota.
- Parcela já faturada não se apaga.
- Gravar exige banco (`exigirBanco()`). Quem edita: sócia e financeiro; o contador só vê (os formulários somem).

## Extrato bancário (`/financeiro/extrato`)

Fluxo: importar o arquivo → as linhas vão para a fila "a classificar" → cada uma vira lançamento.

- Leitor (`src/domain/financeiro/extrato.ts`): OFX 1.x e 2.x; CSV com ou sem cabeçalho (Data; Descrição; Valor), crédito e débito em colunas separadas, sufixo D/C, Windows-1252 ou UTF-8. Linhas de saldo são ignoradas.
- Cada linha tem uma chave (número da conta, no OFX; FITID ou descrição; data; valor; ordem no arquivo): importar o mesmo período de novo não duplica.
- Sugestão por linha (`classificacao.ts`), nesta ordem:
  1. **Já lançado**: um lançamento sem linha de extrato, com o mesmo valor e até 3 dias de diferença. Confirmar só liga os dois, para não contar duas vezes.
  2. **Recebimento de nota** (só crédito): nota a receber com valor líquido ou bruto igual. Com mais de uma nota possível, só sugere quando o nome do cliente na descrição desempata (palavras genéricas como "ltda" e "incorporação" não contam); senão, quem classifica escolhe na lista. Confirmar registra o recebimento.
  3. **Regra**: "descrição tem todas as palavras de X → conta Y", em qualquer ordem, sem acento nem maiúscula; vence o trecho mais longo.
- A mesma nota ou o mesmo lançamento nunca é sugerido para duas linhas. "Confirmar" aplica a sugestão que estava na tela; se ela mudou, só atualiza a tela.
- Uma linha nunca vira dois lançamentos: se duas confirmações chegam juntas (clique duplo, duas abas), a segunda não grava nada.
- Corrigir o recebimento na tela da nota atualiza o mesmo lançamento de receita, que continua ligado à linha do extrato.
- Na mão: escolher a conta (e o processo) ou a nota, e opcionalmente criar a regra com o trecho sugerido (a descrição sem números nem "PIX ENVIADO").
- "Ignorar" tira da fila sem lançar (ex.: transferência entre contas da empresa), com volta. Apagar o lançamento devolve a linha para a fila.
- Tabelas: `extrato_linhas` (com `lancamento_id`) e `regras_classificacao`.
- Limites conhecidos: a nota tem um recebimento só (a paga em duas vezes não se concilia pelo segundo crédito; precisa de mudança no schema); o CSV não traz a conta, então duas contas com a mesma linha no mesmo dia colidem; a projeção do fluxo ainda usa as despesas fixas da base fictícia.

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

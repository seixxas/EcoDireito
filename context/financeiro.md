# Financeiro

Arquivos: `src/domain/financeiro/*`, `src/data/financeiro.ts`, `src/app/(app)/financeiro/*`.
Análise das planilhas reais: aba "Análise das planilhas" do escopo (https://claude.ai/artifact/DcoEDtPMamJWQtwEfL25FH).

## Entidades

- **Nota fiscal**: nº, emissão, cliente, processo e parcela (opcional), valor, ISS (5%), retenção na fonte, previsão e recebimento.
- **Contrato e parcelas**: cada processo tem um contrato. A parcela nasce de um evento do processo:
  - Licenciamento: 3 parcelas (aceite da proposta, emissão do LAA, publicação do TCA).
  - Manejo: 50% na entrada e 50% no término do corte.
- **Lançamento**: entrada ou saída de caixa com data, competência (`AAAA-MM`), conta do plano de contas e, se houver, processo, nota e observação (texto livre para o que a descrição do banco não diz).

## Situações (calculadas, nunca digitadas)

- Nota: `cancelada` · `recebida` · `parcial` · `atrasada` (previsão passou) · `a_receber`.
- Parcela: `aguardando` (evento não aconteceu) · `liberada` (evento aconteceu, sem nota) · `faturada` · `recebida`.

## Telas (redesign de 03/11, guia em `interface.md`)

- Faturamento e Lançamentos abrem no mês atual, com ‹ mês › no topo (`?mes=AAAA-MM`) e "todos os meses" (`?mes=todos`, útil com a busca). Faturamento: parcelas prontas para faturar em lista e abas "Notas do mês" · "Faturado × recebido no ano" (`?aba=grafico`).
- Contratos: o contrato nasce com a proposta (as parcelas são o preço dela), mas a lista e os totais ("Contratado", "Aguardando evento" etc.) só contam processo com proposta aceita, ou seja, evento `aceite_proposta` até hoje (`situacaoDoContrato`). Propostas em aberto aparecem numa linha à parte, com link para o Comercial; recusadas (`proposta_recusada`) ficam de fora.
- Contas a receber: atraso numa barra só, com as faixas clicáveis (`?faixa=`); notas em aberto das mais atrasadas para as menos, com busca (empresa, grupo, nº da NF, serviço, processo) e situação (`?situacao=atrasadas|a-vencer|parcial`). Busca, situação e faixa se somam; cada filtro conta o que os outros deixam passar. Embaixo, "Maiores saldos a receber" por empresa ou grupo (inclui o que ainda vai vencer); clicar filtra a lista.
- Tabelas e listas paginadas de 10 em 10 (`paginar` + `Paginacao`, `?pagina=`, mantendo mês, situação e aba): notas do Faturamento, Contas a receber, Lançamentos, Contratos e as três abas do Extrato. Linha que abre detalhe tem setinha no fim (`AbrirLinha`); link no meio do texto usa a classe `link`.
- DRE: custos, despesas e "fora da DRE" começam recolhidos (só o total do grupo). Cada valor de conta (mês ou total) abre os lançamentos que o formam: `/financeiro/lancamentos?mes=&conta=` (+ `regime=competencia` na DRE por competência, que filtra pela competência). Na competência, a receita vem das notas emitidas e o link vai para o Faturamento do mês.
- Fluxo: abas "Próximas 8 semanas" · "Realizado por mês" (`?aba=realizado`); movimentos da semana recolhidos. Clicar numa semana (barra do gráfico, data ou setinha da tabela) abre o zoom `?semana=AAAA-MM-DD` (segunda-feira): gráfico dia a dia só com entradas e saídas (sem a linha do saldo, que achataria as barras), ‹ › entre as semanas e, embaixo, os movimentos de cada dia com o saldo no fim do dia (`diasDaSemana`).
- Extrato: importação compacta e abas "A classificar" · "Regras" · "Ignoradas" (`?aba=`). A busca vale nas três abas (descrição, valor e o texto da sugestão: NF, cliente, conta); "Confirmar as sugestões" confirma só as que estavam na tela (com a busca, as encontradas).
- Busca (`Busca`, `?q=`, sem acento nem maiúscula): Faturamento (cliente, grupo, NF, serviço, processo; resumo e contagens seguem a busca), Contas a receber, Lançamentos, Contratos (processo, cliente, grupo, nº SEI) e Extrato. Busca e filtros se somam e a paginação conta o resultado.
- Situação da nota é ponto + texto (`SituacaoDaNota`, em `components/financeiro/situacao-nota.tsx`).

## Edição

| Tela | O que faz |
|---|---|
| `/financeiro/notas/nova` | Registra a nota já emitida no site da Prefeitura. Com `?parcela=<id>` (botão "Registrar nota" da parcela liberada), já liga cliente, processo e parcela. |
| `/financeiro/notas/[id]` | Detalhe da nota; registrar ou corrigir o recebimento; cancelar. |
| `/financeiro/lancamentos` | Lançamentos do mês (ou de todos os meses) com busca (descrição, observação, conta, processo, valor) e filtro de conta; `?regime=competencia` filtra o mês pela competência (link da DRE). Lançamento manual (despesa ou receita) com conta, competência, processo e observação. |
| `/financeiro/lancamentos/[id]` | Detalhe com a descrição original do extrato; edita descrição, conta, competência, processo e observação; apaga. |
| `/financeiro/contratos` | Contratado, faturado e a faturar por processo. `/financeiro/contratos/[processoId]` inclui, edita e apaga parcelas. |

Regras (em `src/domain/financeiro/notas.ts` e `lancamentos.ts`, com teste):

- ISS de 5% sobre o valor; retenção na fonte de 5,5% quando marcada. A previsão sugerida é a emissão + 15 dias.
- O número da NF não se repete. A previsão não pode ser antes da emissão. O processo tem de ser do mesmo cliente. Cada parcela tem uma nota só (nota cancelada não conta).
- Um recebimento por nota, com data entre a emissão e hoje. Registrar o recebimento cria o lançamento de receita (`receita_servicos`, com `notaId`); registrar de novo substitui os dois.
- Só se cancela nota sem recebimento.
- Lançamento manual: valor diferente de zero e data até hoje (o previsto vem da projeção do fluxo). Competência vazia = mês da data.
- Edição (`alteracoesDoLancamento`): data e valor não mudam (vêm do banco; para corrigir, apaga e lança de novo). O lançamento de uma nota só aceita a observação e não se apaga: o resto muda pelo recebimento da nota, que preserva a observação.
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
- Extrato de exemplo (`/financeiro/extrato/exemplo`, link na caixa de importação): OFX montado da base do dia por `extrato-exemplo.ts` (duas saídas já lançadas, um PIX recebido com o valor único de uma nota em aberto, um PIX enviado e uma tarifa sem lançamento). O teste confere em várias datas que a conciliação sugere exatamente isso; baixar de novo no mesmo dia não duplica.
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

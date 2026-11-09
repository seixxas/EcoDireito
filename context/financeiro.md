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

- Lançamentos: a observação aparece embaixo da descrição. A competência não tem coluna: só aparece, embaixo da descrição e em destaque, quando não é o mês do pagamento ("Competência set/26 · mês anterior ao pagamento", `textoDaCompetencia`), com a explicação no pé da tabela. A mesma explicação vai na tela do lançamento e na dica do campo.
- Lançamentos abre no mês atual, com ‹ mês › no topo (`?mes=AAAA-MM`) e "todos os meses" (`?mes=todos`, útil com a busca). O Faturamento usa o mesmo seletor só nas abas Recebidas e Todas (veja "Faturamento: abas do ciclo").
- Contratos: o contrato nasce com a proposta (as parcelas são o preço dela), mas a lista e os totais ("Contratado", "Aguardando evento" etc.) só contam processo com proposta aceita (`situacaoDoContrato`, que segue a `situacaoDaProposta` do Comercial: aceite até hoje e sem recusa). Propostas em aberto aparecem numa linha à parte, com link para o Comercial; recusadas (`proposta_recusada`) ficam de fora.
- Tabelas e listas paginadas de 10 em 10 (`paginar` + `Paginacao`, `?pagina=`, mantendo mês, situação e aba): as abas do Faturamento, Lançamentos, Contratos e as três abas do Extrato. Linha que abre detalhe tem setinha no fim (`AbrirLinha`); link no meio do texto usa a classe `link`.
- DRE: grade no modelo da planilha do Ecoamper (detalhes na seção DRE, abaixo). Abre só com os blocos e os resultados; contas abrem com um clique ou "Abrir todas as linhas". Cada valor de conta ou bloco (mês ou período) abre, abaixo da tabela e sem sair dela, o que o forma (`?linha=&mes=`, 10 por página). Subtotal não abre. Na competência, a receita abre as notas emitidas.
- Fluxo: abas "Próximas 8 semanas" · "Realizado por mês" (`?aba=realizado`); movimentos da semana recolhidos. Clicar numa semana (barra do gráfico, data ou link da tabela) abre o zoom `?semana=AAAA-MM-DD` (segunda-feira): gráfico dia a dia só com entradas e saídas (sem a linha do saldo, que achataria as barras), ‹ › entre as semanas e, embaixo, os movimentos de cada dia com o saldo no fim do dia (`diasDaSemana`).
- Extrato: importação compacta e abas "A classificar" · "Regras" · "Ignoradas" (`?aba=`). A busca vale nas três abas (descrição, valor e o texto da sugestão: NF, cliente, conta); "Confirmar as sugestões" confirma só as que estavam na tela (com a busca, as encontradas).
- Busca (`Busca`, `?q=`, sem acento nem maiúscula): Faturamento (cliente, grupo, NF, serviço, processo; na parcela, processo, nº SEI, cliente, grupo e parcela; frase, abas e contagens seguem a busca), Lançamentos, Contratos (processo, cliente, grupo, nº SEI) e Extrato. Busca e filtros se somam e a paginação conta o resultado.
- Situação da nota é ponto + texto (`SituacaoDaNota`, em `components/financeiro/situacao-nota.tsx`).

## Identidade visual no Financeiro (09/11)

- Gráficos (`src/components/charts`): barras e áreas em degradê da marca, cheias em cima e sumindo para baixo (`Degrades` e `useIdDoGrafico` em `estilo.tsx`; cores por variável, o tema escuro troca sozinho). Entradas em verde, saídas e o menor saldo em âmbar, saldo negativo em vermelho; no fluxo mensal, uma área bem clara sob a linha do saldo.
- Números-chave (totais de Contratos, conta do Fluxo, resumo da Lucratividade e do projeto): linha fina em degradê no topo (`LINHA_DA_COPA` em `financeiro/_components/identidade.ts`). Barra da receita e do faturado em degradê (`BARRA_DA_COPA`).
- Passos da importação do Extrato com o número num círculo da copa.
- Quadros do ciclo do Faturamento e hover das tabelas vêm dos componentes comuns (`Abas`, `.tabela`).

## Faturamento: abas do ciclo (`/financeiro`)

Uma tela só, do faturar ao receber. Regras em `src/domain/financeiro/ciclo.ts` (com teste). Contas a receber saiu: `/financeiro/receber` redireciona para `?aba=atrasadas`, mantendo `q` e `faixa`.

| Aba (`?aba=`) | O que entra | Valor da aba | Colunas |
|---|---|---|---|
| `a-faturar` | Parcelas liberadas sem nota | Soma das parcelas | Processo, parcela, cliente, liberada em, valor, "Registrar nota" |
| `a-vencer` | Em aberto, previsão depois de hoje | Saldo | Cliente e NF, previsão, saldo, "Receber" e "Cobrar" |
| `hoje` | Em aberto, previsão hoje | Saldo | Iguais às de A vencer |
| `atrasadas` | Em aberto, previsão já passou | Saldo | Cliente e NF, previsão, atraso, saldo, "Receber" e "Cobrar" |
| `recebidas` | Recebidas no mês do recebimento | Valor recebido | Cliente e NF, recebida em, valor recebido |
| `todas` | Notas emitidas no mês, inclusive canceladas | Líquido, sem as canceladas | NF, emissão, cliente e serviço, líquido, previsão, situação |

- Cada nota tem uma aba de estado só (`abaDaNota`), e vale a `situacaoNota`: a diferença de até R$ 1 que ela tolera conta como recebida. Em aberto inclui a recebida em parte, que segue a previsão, mostra o saldo e não entra em Recebidas. Cancelada só aparece em Todas. A linha de notas atrasadas do Hoje conta do mesmo jeito.
- As quatro primeiras abas mostram o estado de agora. O mês (`?mes=`, com "todos os meses") só vale em Recebidas e Todas e só fica na URL delas; nas outras, essas duas contam o mês atual.
- Sem `?aba=`, abre a primeira aba com itens (depois da busca); sem nenhuma, Todas. Todo link leva a aba na URL, para ela não mudar sozinha depois de um recebimento.
- Atrasadas: faixas `?faixa=1-15|16-30|31-60|60+` e ordem `?ordem=saldo` ("Mais atrasadas" é o padrão). Faixa e ordem só valem nessa aba.
- Quem não pode editar (contador) não vê "Registrar nota", "Receber" nem "Cobrar", e o painel fica só com os dados, mesmo com `?acao=` na URL.

Painel da nota:

- Clicar na linha abre o painel à direita (`?nota=<id>`), sem sair da lista; no celular ele ocupa a tela toda. O conteúdo é o `DetalheDaNota`, o mesmo de `/financeiro/notas/[id]`. Fecha pelo botão ou com Esc, mantendo aba, busca, filtros e página.
- "Receber" (`&acao=receber`) põe o formulário de recebimento primeiro, com o saldo e a data de hoje (`recebimentoSugerido`).
- **Recebida em parte:** a nota guarda um recebimento só e gravar de novo substitui o anterior. Por isso "Receber" traz o que já está gravado e explica que se informa o total: sugerir o saldo apagaria o que entrou antes. Dois recebimentos por nota precisam de mudança no schema.
- "Cobrar" (`&acao=cobrar`) põe primeiro a mensagem pronta (`mensagemDeCobranca`: cliente, NF, valor ou saldo, dias de atraso), editável, com "Copiar mensagem". Não há envio nem registro de cobrança.

## Faturado × recebido (`/financeiro/faturado-recebido`)

Gráfico por mês: faturado pela emissão, recebido pelo caixa. Link discreto no Faturamento.

## Lucratividade por projeto (simulação)

- Lista em `/financeiro/lucratividade` e detalhe em `/financeiro/lucratividade/[processoId]`. Regras em `src/domain/financeiro/lucratividade.ts` (com teste).
- Entram os processos com proposta aceita. Por projeto: contrato (soma das parcelas), faturado (notas não canceladas), recebido, custos diretos (saídas com o processo, por conta) e equipe.
- **Equipe é simulada**: horas = faturado em R$ mil × horas por mil (licenciamento 1,5; manejo 2,5) × uma variação de 0,7 a 1,3 tirada do id do processo, vezes R$ 95/h. Troca pelo registro de horas quando existir.
- Margem = faturado − custos diretos − equipe, sobre o faturado: boa a partir de 40%, atenção de 20% a 40%, ruim abaixo de 20%. Sem faturamento, sem margem (vai para o fim da lista).
- Resumo: margem média ponderada pelo faturado, receita × custo, mais e menos lucrativo. Busca e filtro por margem (`?margem=boa|atencao|ruim`), paginação.
- Detalhe: barras de receita × custo (custo por conta, equipe listrada), custos por conta com link para os lançamentos (`/financeiro/lancamentos?mes=todos&processo=&conta=`) e as notas do projeto. Selo "Simulação" e a frase do que é estimado nas duas telas.

## Edição

| Tela | O que faz |
|---|---|
| `/financeiro/notas/nova` | Registra a nota já emitida no site da Prefeitura. Com `?parcela=<id>` (botão "Registrar nota" da parcela liberada), já liga cliente, processo e parcela. |
| `/financeiro/notas/[id]` | Detalhe da nota; registrar ou corrigir o recebimento; cancelar. O painel do Faturamento faz o mesmo (`DetalheDaNota`). |
| `/financeiro/lancamentos` | Lançamentos do mês (ou de todos os meses) com busca (descrição, observação, conta, processo, valor), filtro de conta e de processo (`?processo=`, link da lucratividade). Lançamento manual (despesa ou receita) com conta, competência, processo e observação. |
| `/financeiro/lancamentos/[id]` | Detalhe com a descrição original do extrato e a competência explicada; edita descrição, conta, competência, processo e observação; apaga. |
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
- **Grade**: cada mês é um bloco com o realizado. A coluna das contas fica travada à esquerda e o bloco do período (realizado e % da receita líquida), à direita, em tela larga. Rolagem lateral pela barra de cima (`TabelaRolavel`).
- **Linhas**: todo valor tem sinal (receita positiva, despesa negativa), então cada subtotal é a soma do que veio acima. Grupo com mais de uma conta vira bloco; o que não compõe o resultado fica na seção "Movimentação de caixa", sem meta, e fecha em Variação de caixa.
- **Meta**: a Eco Direito ainda não definiu metas, então a grade mostra só o realizado, como a planilha do Ecoamper faz sem meta. Meta real pede tabela nova e tela de edição.
- **Período** (`?periodo=`): completo, até o último mês fechado ou trimestre, mesmo incompleto. Trocar período ou regime fecha o quadro de lançamentos.
- **Excel**: `/financeiro/dre/exportar`, rota própria para o CSV não viajar em todo clique. CSV com `;`, vírgula decimal e BOM (`csvDaDre`), com todas as linhas, mesmo recolhidas, no período e no regime da tela. Rótulo que começa com = + - @ leva apóstrofo, senão o Excel lê como fórmula.
- A grade e o quadro de lançamentos saem da mesma função (`itensDoRegime`): o que abre sempre soma o valor da célula.
- Modelo: DRE do Ecoamper, só a planilha. De lá ficaram de fora os filtros de empresa e centro de custo (a Eco Direito não tem), as categorias abaixo de cada conta (aqui a conta é o menor nível), a importação e, por enquanto, as colunas de meta. Valores em reais, não em R$ mil: as contas pequenas sumiriam.

## Fluxo de caixa

- Realizado: soma dos lançamentos por mês, com o saldo.
- Projetado (8 semanas): notas a receber pela previsão, parcelas liberadas (emissão + 20 dias) e despesas recorrentes.
- Notas atrasadas ficam fora da projeção (conservador) e aparecem à parte.

## Fatos das planilhas reais (jan–set/2026) que guiam o produto

- Cerca de 19 notas por mês, nota mediana de R$ 7 mil; prazo mediano até receber: 17 dias.
- 28 notas de R$ 1.000 emitidas junto com outra nota do mesmo cliente (natureza a confirmar).
- 66 notas com retenção de 5,5% na fonte.
- DAS pago ≈ 15,6% do faturado; ISS pago por guia separada desde abril (sublimite do Simples, a confirmar).

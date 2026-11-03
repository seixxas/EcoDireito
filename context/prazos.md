# Prazos e processos

Arquivos: `src/domain/processos.ts` (fases e eventos), `src/domain/prazos.ts` (regras e motor),
`src/domain/feriados.ts`, `src/data/processos.ts`.

## Modelo

- **Processo**: cliente, empreendimento, nº SEI (só depois da autuação), nº SIMPROC (se antigo), nº TCA, fase atual (1 a 8) e eventos.
- **Evento** (na tela, "etapa"): algo que aconteceu ou está com data marcada (`comunique_se`, `tca_publicado`, `corte_planejado`...). Origem `diario` ou `manual`, e observação opcional.
- **Regra de prazo**: gatilho (tipo de evento), quantidade, unidade, tipo, evento que cumpre e base legal.
- **Prazo**: gerado pelo motor (`gerarPrazos`) aplicando as regras aos eventos. Nunca é digitado à mão.

## As 8 fases e as etapas de cada uma (as mesmas do portal do cliente)

Cada fase é um checklist de etapas (`EVENTOS` e `etapasDaFase` em `src/domain/processos.ts`). Cada etapa diz quem faz, se chega pelo Diário Oficial e se é a etapa final da fase.

| Fase | Etapas (★ = etapa final) | Quem faz |
|---|---|---|
| 1 Proposta | Proposta enviada · ★ Orçamento aprovado · Proposta recusada (só se o cliente recusar; motivo na observação) | Eco Direito; cliente |
| 2 Documentação | Projeto ambiental elaborado · Documentação do cliente recebida · ★ Processo aberto na SVMA (autuação, gera o nº SEI) | Eco Direito; cliente |
| 3 Análise | Guia de vistoria emitida · Guia paga e comprovante enviado · ★ Vistoria realizada | SVMA; cliente e Eco Direito |
| 4 Resposta | Comunique-se publicado (Diário, só se houver pendência, repete) · Resposta protocolada (repete) · ★ LAA e parecer técnico emitidos | SVMA; Eco Direito |
| 5 Compromisso das Partes | Parte técnica aprovada (Diário) · Extrato do TCA (Diário) · Cláusula 9.3 · Alvará emitido (SMUL) · ★ Alvará protocolado · FEMA ou mudas (corre em paralelo, 6 meses) | SVMA, Câmara, SMUL, Eco Direito |
| 6 Manejo | Data do corte marcada · Aviso de início · Corte concluído · ★ Relatório de manejo | Eco Direito |
| 7 Construção | Obra iniciada · ★ Obra concluída | Cliente |
| 8 Compensação | Data do plantio marcada · Aviso · Plantio concluído · Relatório fotográfico · CRP (Diário) · ★ Certificado definitivo (Diário, encerra) | Eco Direito; SVMA |

**Ordem da fase 4 (passo a passo da Eco Direito):** depois da vistoria, se estiver tudo certo, sai direto o LAA (Laudo de Avaliação Ambiental) com o parecer técnico e as plantas aprovadas. Se houver pendência, vem o Comunique-se, a Eco Direito responde em 30 dias (pode repetir) e só então sai o LAA. O LAA libera a 2ª parcela do licenciamento.

**Como a fase avança** (`faseDepoisDoEvento`), igual para etapa marcada à mão ou ato confirmado no Diário Oficial:
- a etapa final da fase leva o processo para a fase seguinte;
- uma etapa de fase mais adiante leva o processo até ela (quando a etapa final de antes não foi registrada);
- data marcada para a frente não muda a fase, e o processo nunca volta de fase sozinho (corrija em "Editar").

## Proposta (fase 1)

- Começa em Comercial > "Nova proposta" (`/comercial/nova`): numa transação, cria o processo na fase 1 (sem nº SEI), o texto da proposta (tabela `propostas`: escopo, validade, data) e o contrato com as parcelas do serviço (`parcelasDaProposta`, `src/domain/propostas.ts`: licenciamento 30/30/40 no aceite/LAA/TCA, manejo 50/50 no aceite/corte).
- A situação sai das etapas (`situacaoDaProposta`): em elaboração → enviada (`proposta_enviada`) → aprovada (`aceite_proposta`, leva à fase 2 e libera a 1ª parcela) ou recusada (`proposta_recusada`). Enviada há mais de 7 dias sem resposta pede retorno e aparece no Hoje.
- Aba "Proposta" do processo (abre primeiro na fase 1): o documento para imprimir ou salvar em PDF, os botões "Marcar como enviada", "Cliente aprovou", "Cliente recusou" e "Editar o texto".
- Recusada sai de `listarProcessos` e da contagem por cliente; continua no Comercial e no endereço do processo. Contratos (financeiro) só contam proposta aceita.
- Quem vê: o perfil com `comercial` (sócia edita; financeiro e equipe veem). A equipe marca as etapas porque edita prazos.

## Tela do processo

- Barra das 8 fases clicável (`?fase=N`): abre o checklist daquela fase na aba **Etapas** (padrão; sem `?fase`, a fase atual). Cada etapa mostra feita (data, origem, observação), data marcada, falta, "não houve" (opcional numa fase encerrada) ou "sem registro".
- Etapa pendente mostra o prazo em aberto que ela cumpre ("Responder o Comunique-se: venceu há 4 dias") e o botão "Marcar como feita" com só os campos que fazem sentido: data, observação, prazo do ato (só no Comunique-se) e nº SEI (só na autuação de processo sem SEI).
- Data no futuro só para etapa de data marcada (corte e plantio); as outras se marcam depois de acontecer.
- Abas Prazos, Linha do tempo (com observação e "fechou a fase X") e Cobrança.

## Tipos de prazo

- **Obrigação**: prazo fatal da Eco Direito ou do cliente (Comunique-se, cláusulas do TCA, relatórios).
- **Expectativa do órgão**: quando a Prefeitura deveria agir. Vencido = "órgão atrasado".
- **Antecedência**: contado para trás a partir de uma data planejada (aviso 10 dias antes do corte).
- **Validade**: janelas longas (parecer de 18 meses, 2 anos para o Alvará, manutenção de 6 meses).

## Regras de contagem (Lei Municipal 14.141/2006, art. 40)

- Conta a partir da publicação, excluindo o dia do início e incluindo o do fim, em dias corridos.
- Se o vencimento cai em dia sem expediente, vai para o próximo dia útil.
- Antecedência que cai em dia sem expediente volta para o dia útil anterior.
- Prazo escrito no próprio ato ("60 dias") substitui o padrão: campo `diasNoAto` do evento. Só vale no Comunique-se: do Diário ele é lido sozinho (`prazoDoAto`); marcado à mão, o campo "O ato deu outro prazo?" aparece só nessa etapa.
- Feriados em `src/domain/feriados.ts` (nacionais, estaduais e municipais de SP, 2026 e 2027).

## Edição (E3)

- Clientes em `/processos/clientes`; processos em `/processos/novo` e `/processos/[id]/editar`. Gravações em `src/data/processos.ts`, actions em `src/app/(app)/processos/actions.ts`.
- Processo novo começa na fase 1 (Proposta), sem nº SEI. O nº SEI entra na autuação (ou em "Editar") e não se repete: é por ele que o Diário Oficial acha o processo. Processo sem SEI só é achado pelo nº SIMPROC ou pelo CNPJ. Formatos validados: SEI `6027.2026/0000021-3`, SIMPROC `2016-0.084.512-3`.
- Evento manual: "Marcar como feita" na etapa (aba Etapas). Os prazos não são gravados; o motor recalcula na leitura.
- Apagar um evento (na linha do tempo) não mexe na fase: corrija em "Editar".
- Apagar evento vindo do Diário Oficial devolve o ato para a caixa de entrada.
- Só quem tem `prazos: editar` (sócia, equipe) vê os botões; o perfil financeiro só vê.

## Situação de um prazo

`cumprido` (existe o evento que cumpre) · `vencido` · `hoje` · `proximo` (até 10 dias) · `no_prazo`.

Na tela, situação é ponto + texto (`SituacaoPrazo`); prazo do órgão atrasado fica âmbar ("SVMA atrasada"), nunca vermelho.

## Tela de prazos

- Vistas: nossos prazos (padrão), aguardando a SVMA (`?filtro=orgao`) e cumpridos (`?filtro=cumpridos`, do mais recente ao mais antigo).
- Busca (`?q=`) por cliente, grupo, empreendimento, nº SEI, título do prazo e responsável, e filtro por responsável (`?responsavel=`, nome completo; as opções saem dos processos). Busca, responsável e vista se somam; os contadores das vistas e dos responsáveis mostram o resultado filtrado. O resumo do topo é sempre do escritório inteiro.
- Clientes (`/processos/clientes`): busca por nome, CNPJ (com ou sem pontuação) e grupo.
- Processos (`/processos`): busca por empreendimento, endereço, cliente, grupo, nº SEI, SIMPROC e TCA e responsável, e filtro por fase (`?fase=1` a `8`; o botão mostra só a primeira palavra da fase). Os contadores das fases mostram o resultado da busca.
- Todas paginadas de 10 em 10 (`?pagina=`). A página corta a lista em ordem de vencimento e só então agrupa por `periodoDoPrazo`: vencidos, esta semana (até domingo), próximas semanas (as 4 seguintes) e mais adiante.
- Também paginados: `/processos`, `/processos/clientes`, as abas do Diário Oficial e a linha do tempo do processo.
- Cada prazo é uma `LinhaPrazo` (`src/components/prazos/linha-prazo.tsx`), a mesma da aba Prazos do processo. Data de outro ano aparece com o ano (`formatarDataNaLista`).

## Pontos a validar com a Eco Direito

- LAA e parecer técnico conclusivo viraram uma etapa só (o passo a passo escreve "LAA / Parecer Técnico"). A validade de 18 meses conta dela.
- Pode vir Comunique-se depois do LAA (na Câmara, por exemplo)? Hoje ele fica na fase 4 e não volta a fase.
- A guia de vistoria, a vistoria e o LAA saem no Diário Oficial ou só no SEI? Hoje são marcados à mão.
- Processo só de manejo pula a fase 4 (Resposta)? Hoje as fases sem etapas aparecem como "sem registro".

- O Alvará conta da emissão (Portaria SVMA 105/2024, art. 51) e não da publicação, como diz o passo a passo. O sistema usa a emissão.
- Relatório de manejo: 20 dias (Portaria, art. 57) ou 30 (passo a passo). O sistema usa 20.
- As regras estão em `REGRAS_SVMA`. Hoje vivem no código; no banco, viram cadastro editável.
- Ponto facultativo municipal não está em `feriados.ts` (ex.: 30/10/2026, Dia do Servidor transferido; não teve Diário Oficial). Ele prorroga prazo como dia sem expediente? Se sim, entra na tabela.

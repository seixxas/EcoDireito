# Prazos e processos

Arquivos: `src/domain/processos.ts` (fases e eventos), `src/domain/prazos.ts` (regras e motor),
`src/domain/feriados.ts`, `src/data/processos.ts`.

## Modelo

- **Processo**: cliente, empreendimento, nº SEI, nº SIMPROC (se antigo), nº TCA, fase atual (1 a 7) e eventos.
- **Evento**: algo que aconteceu ou está planejado (`comunique_se`, `tca_publicado`, `corte_planejado`...). Origem: `diario` ou `manual`.
- **Regra de prazo**: gatilho (tipo de evento), quantidade, unidade, tipo, evento que cumpre e base legal.
- **Prazo**: gerado pelo motor (`gerarPrazos`) aplicando as regras aos eventos. Nunca é digitado à mão.

## As 7 fases (as mesmas do portal do cliente)

1 Documentação · 2 Análise · 3 Resposta · 4 Compromisso das Partes · 5 Manejo · 6 Construção · 7 Compensação

## Tipos de prazo

- **Obrigação**: prazo fatal da Eco Direito ou do cliente (Comunique-se, cláusulas do TCA, relatórios).
- **Expectativa do órgão**: quando a Prefeitura deveria agir. Vencido = "órgão atrasado".
- **Antecedência**: contado para trás a partir de uma data planejada (aviso 10 dias antes do corte).
- **Validade**: janelas longas (parecer de 18 meses, 2 anos para o Alvará, manutenção de 6 meses).

## Regras de contagem (Lei Municipal 14.141/2006, art. 40)

- Conta a partir da publicação, excluindo o dia do início e incluindo o do fim, em dias corridos.
- Se o vencimento cai em dia sem expediente, vai para o próximo dia útil.
- Antecedência que cai em dia sem expediente volta para o dia útil anterior.
- Prazo escrito no próprio ato ("60 dias") substitui o padrão: campo `diasNoAto` do evento.
- Feriados em `src/domain/feriados.ts` (nacionais, estaduais e municipais de SP, 2026 e 2027).

## Edição (E3)

- Clientes em `/processos/clientes`; processos em `/processos/novo` e `/processos/[id]/editar`. Gravações em `src/data/processos.ts`, actions em `src/app/(app)/processos/actions.ts`.
- O nº SEI não se repete: é por ele que o Diário Oficial acha o processo. Formatos validados: SEI `6027.2026/0000021-3`, SIMPROC `2016-0.084.512-3`.
- Evento manual: "Lançar evento" na linha do tempo do processo. Os prazos não são gravados; o motor recalcula na leitura.
- Evento que já aconteceu leva o processo à fase dele (`faseDepoisDoEvento`). Evento planejado não muda a fase, e o processo nunca volta de fase sozinho: apagar um evento não mexe na fase (corrija em "Editar").
- Apagar evento vindo do Diário Oficial devolve o ato para a caixa de entrada.
- Só quem tem `prazos: editar` (sócia, equipe) vê os botões; o perfil financeiro só vê.

## Situação de um prazo

`cumprido` (existe o evento que cumpre) · `vencido` · `hoje` · `proximo` (até 10 dias) · `no_prazo`.

## Pontos a validar com a Eco Direito

- O Alvará conta da emissão (Portaria SVMA 105/2024, art. 51) e não da publicação, como diz o passo a passo. O sistema usa a emissão.
- Relatório de manejo: 20 dias (Portaria, art. 57) ou 30 (passo a passo). O sistema usa 20.
- As regras estão em `REGRAS_SVMA`. Hoje vivem no código; no banco, viram cadastro editável.
- Ponto facultativo municipal não está em `feriados.ts` (ex.: 30/10/2026, Dia do Servidor transferido; não teve Diário Oficial). Ele prorroga prazo como dia sem expediente? Se sim, entra na tabela.

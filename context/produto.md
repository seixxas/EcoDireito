# Produto e glossário

## Quem é quem

- **Awer**: consultoria que desenvolve o sistema.
- **Eco Direito Ambiental**: o cliente. Conduz o licenciamento ambiental de empreendimentos na Prefeitura de SP.
  - Sócias: Elaine (lança as notas), Karim (extrato, cartão e conciliação) e Cissa.
  - Contador externo: Alexandre.
  - Empresa irmã: **Ambiente Legal**. Faz o manejo e recebe empréstimos (mútuo) da Eco Direito.
- **Clientes da Eco Direito**: construtoras e incorporadoras. Quase sempre uma **SPE** (empresa criada para um único empreendimento) de um grupo maior.

## Vocabulário: projeto

Na tela, o trabalho que a Eco Direito faz para um cliente, da proposta à compensação, é um **projeto**. A palavra vale em tudo o que a pessoa lê: menu, títulos, botões, mensagens e endereços (`/projetos`).

- **"Processo" só para o processo oficial na Prefeitura**: abertura do processo na SVMA, processo SEI, processo antigo do SIMPROC e o texto dos atos do Diário Oficial. Trocar nesses casos deixaria o texto errado, inclusive na proposta enviada ao cliente.
- **"Projeto ambiental"**, sempre com o adjetivo, é o documento técnico da Fase 2. Não confundir com o projeto como um todo.
- **No código e no banco o nome continua `processo`** (`Processo`, `processoId`, tabela `processos`, `src/domain/processos.ts`). Renomear o banco é mudança de schema. Nesta documentação, "processo" sem mais contexto é o projeto.

## Módulos

0. **Comercial** (`/comercial`): o funil de propostas. Cada proposta é a fase 1 de um processo; aprovada, o processo segue para a Documentação. Detalhe em `prazos.md` (seção Proposta). Prospecção (`/comercial/prospeccao`, em desenvolvimento) é só uma prévia: achar obras e empresas que vão precisar da Eco Direito (alvarás novos no Diário, SPEs de grupos clientes, terrenos com vegetação no GeoSampa).
1. **Processos e prazos**: cada processo com as 8 fases (da Proposta à Compensação), as etapas de cada uma e os prazos calculados por regra. Detalhe em `prazos.md`.
2. **Diário Oficial**: um robô lê o Diário Oficial da Cidade e acha os atos dos processos. Detalhe em `publicacoes.md`.
3. **Portal do cliente**: a construtora acompanha o próprio processo, só para leitura.
4. **Financeiro**: substitui as planilhas (notas, contas a receber, DRE, fluxo de caixa). Detalhe em `financeiro.md`.

## Glossário

| Termo | O que é |
|---|---|
| SVMA | Secretaria Municipal do Verde e do Meio Ambiente (SP), o órgão dos processos |
| SEI | Sistema de processos eletrônicos da Prefeitura. Número `6027.2024/0024839-8` |
| SIMPROC | Sistema antigo de processos em papel. Número `2017-0.169.266-6`. Em atos antigos, só aparece no texto |
| DOC-SP | Diário Oficial da Cidade de São Paulo, onde a SVMA publica os atos |
| DJEN | Diário de Justiça Eletrônico Nacional. Só importa se houver processo judicial |
| Comunique-se | Ato da SVMA pedindo documentos ou correções. Abre prazo (em geral 30 dias) |
| Parecer conclusivo | Fim da análise técnica. Vale 18 meses |
| Câmara de Compensação | Colegiado que define a compensação ambiental |
| TCA | Termo de Compromisso Ambiental. Tem cláusulas com prazo (9.3, 9.5, 9.7) |
| LAA | Laudo de Avaliação Ambiental. Sai com o parecer técnico e as plantas aprovadas, depois da vistoria (ou da resposta ao último Comunique-se). Fecha a fase Resposta e libera a 2ª parcela do licenciamento |
| Alvará de Execução | Emitido pela SMUL (urbanismo). Precisa ser protocolado na SVMA |
| FEMA | Fundo municipal. A compensação pode ser paga nele em vez de entregar mudas |
| Manejo | Corte, poda ou transplante de árvores autorizado |
| CRP | Certificado de Recebimento Provisório. Exigido para o Habite-se |
| Certificado Definitivo | Encerra o processo depois da manutenção do plantio |
| ART | Anotação de Responsabilidade Técnica. Custo por relatório técnico |

## Fontes completas

- Panorama técnico (fontes, leis, regras): `docs/referencia/PANORAMA.md`
- Passo a passo da Eco Direito: `docs/referencia/PASSO A PASSO.docx`
- Mockup original do portal: `docs/referencia/Processo_Projeto_XYZ.html`
- Escopo vivo (Claude Doc): https://claude.ai/artifact/DcoEDtPMamJWQtwEfL25FH

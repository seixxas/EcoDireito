# Eco Direito — Panorama do desenvolvimento

> Documento de partida do projeto. Pesquisa feita em **28/10/2026**: as fontes de dados foram testadas ao vivo nessa data e as leis foram lidas no texto oficial. Itens marcados com **(validar)** dependem de confirmação com a Eco Direito.

---

## 0. Resumo executivo

1. **O processo descrito no "Passo a passo" é municipal.** Trata-se do licenciamento de manejo arbóreo e da compensação ambiental na **Secretaria do Verde e do Meio Ambiente (SVMA) da Prefeitura de São Paulo**. Nele aparecem TCA, Câmara de Compensação, Comunique-se, Alvará de Execução, FEMA, Viveiro Manequinho e CRP para o Habite-se. **Esses atos são publicados no Diário Oficial da Cidade de São Paulo (DOC-SP), não no Diário de Justiça do TJSP.** Isso foi confirmado em publicações reais de 27 e 28/10/2026.
2. **O link do TJSP enviado (`dje.tjsp.jus.br/cdje`) está congelado.** A última edição pesquisável é de **22/07/2025**. Desde **16/05/2025** os prazos judiciais do TJSP correm pelo **DJEN**, o Diário de Justiça Eletrônico Nacional do CNJ (Res. CNJ 455/2022 + Comunicado Conjunto TJSP 371/2025).
3. **Há fonte gratuita e automatizável para os dois lados:**
   - **DOC-SP "Diário Aberto":** download diário em CSV/JSON, sem captcha, com o número do processo SEI numa coluna própria.
   - **DJEN Comunica API:** pública e sem autenticação. Filtra por tribunal, número do processo, parte, OAB e texto.
4. **A GeckoAPI não serve.** É um scraper genérico (e-commerce, imóveis, Reclame Aqui) e não cobre tribunal nem diário oficial. **O DataJud** traz só metadados e estava instável nos testes. Os termos de uso dele falam em "fins não comerciais". Fica fora do MVP.
5. **O sistema não é só um buscador de publicações.** É um **motor de prazos por processo**, com 4 tipos de prazo: obrigação do cliente, expectativa do órgão, antecedência e período/validade. As publicações são uma das fontes de eventos; a outra é o lançamento manual.
6. **O passo a passo e a Portaria SVMA 105/2024 divergem em pelo menos 2 prazos** (ver §4.3). As regras de prazo precisam ser **configuráveis**, não fixas no código.
7. **Proposta de execução** (detalhes no §8):
   - Fase 0: validação com o cliente, cerca de 1 semana.
   - MVP de gestão de prazos e portal: cerca de 3–4 semanas.
   - Monitoramento automático do DOC-SP: cerca de 2 semanas.
   - DJEN/TJSP, se confirmado que é necessário: cerca de 1 semana.

---

## 1. Entendimento do negócio

### 1.1 Quem é quem

| Ator | Papel |
|---|---|
| **Awer** | Consultoria. Desenvolve o sistema e assina o portal ("Painel elaborado por Awer"). |
| **Eco Direito Ambiental** | Cliente. Conduz os processos ambientais dos empreendimentos junto à SVMA e cuida dos prazos. |
| **Clientes da Eco Direito** | Construtoras e empreendedores. Pelo mockup HTML, recebem um **painel de acompanhamento** do projeto deles com as fases e as datas-limite. |

### 1.2 O processo real (Passo a passo + Portaria SVMA 105/2024)

| # | Etapa | Evento que dispara | Prazo | Tipo | Onde o evento aparece |
|---|---|---|---|---|---|
| 1 | Autuação | Orçamento aprovado | — | interno | manual |
| 2 | Guia de vistoria / parecer | Autuação | Guia em **5–15 dias** | expectativa do órgão | SEI / DOC-SP (validar) |
| | | Guia emitida | Pagamento em **30 dias**, depois enviar o comprovante | **obrigação** | manual |
| 3 | Análise técnica e vistoria | Pagamento | 1ª vistoria em **45–60 dias** | expectativa do órgão | — |
| | | **Comunique-se publicado** | **30 dias** (ou o prazo escrito no próprio ato, p.ex. "60 dias") | **obrigação** | **DOC-SP**, série *Comunique-se* |
| | | Parecer conclusivo emitido | Validade de **18 meses**; pedir renovação **≥30 dias antes** (Port. 105, art. 19) | validade | DOC-SP / SEI |
| 4 | Câmara de Compensação → TCA | Parte técnica aprovada | TCA em **4–6 meses** | expectativa do órgão | **DOC-SP**, *Extrato do TCA* |
| 5 | Cláusulas do TCA | Emissão do TCA | Cláusula 9.3 em **30 dias** | **obrigação** | DOC-SP; o texto das cláusulas só está no SEI |
| | | **Alvará de Execução** (cl. 9.5) | Protocolar na SVMA em **30 dias** | **obrigação** | SMUL / DOC-SP (validar) |
| | | Protocolo do Alvará | FEMA: guia e quitação em **6 meses**; **ou** mudas: agendar com o Viveiro Manequinho em **30 dias** e entregar em **até 6 meses** | **obrigação** | manual |
| | | Publicação do extrato do TCA | Obter o Alvará em até **2 anos**, sob pena de rescisão do TCA (Port. 105, art. 53) | validade | DOC-SP |
| | | Cl. 9.7 SINAFLOR | Normalmente cumprida no manejo | obrigação | manual |
| 6 | Manejo / corte | Data planejada do corte | Aviso de Início **≥10 dias antes** | antecedência | manual |
| | | Fim do corte | Relatório de Manejo em **30 dias** (passo a passo) / **20 dias** (Portaria) | **obrigação** | manual |
| 7 | Compensação e encerramento | Fim da obra | Plantio estimado em **2–2,5 anos** | expectativa | manual |
| | | Data planejada do plantio | Aviso de Início **≥10 dias antes** | antecedência | manual |
| | | Plantio concluído | Relatório fotográfico em **30 dias** | **obrigação** | manual |
| | | Vistoria de verificação OK | **CRP**, exigido para o Habite-se | marco | **DOC-SP**, *Certificado* |
| | | CRP emitido | Manutenção de **6 meses** com relatório fotográfico | período | manual |
| | | Vistoria final OK | **Certificado de Recebimento Definitivo** | marco final | **DOC-SP** |

**Os 4 tipos de prazo que o sistema precisa modelar:**

- **Obrigação do cliente.** Prazo fatal contado a partir de um evento. Exemplo: Comunique-se, 30 dias.
- **Expectativa do órgão.** Serve para prever datas e detectar atraso da Prefeitura. Exemplo: TCA em 4–6 meses.
- **Antecedência.** Contado *para trás* a partir de uma data planejada. Exemplo: aviso ≥10 dias antes do corte.
- **Período / validade.** Janelas longas. Exemplos: parecer válido por 18 meses, manutenção de 6 meses, 2 anos para obter o Alvará.

### 1.3 Mockup HTML × processo real

O `Processo_Projeto_XYZ.html` tem **7 fases voltadas ao cliente final**, com **uma** data-limite por fase. O processo real tem **vários prazos por fase**, e os nomes não batem 1:1. Proposta de mapeamento (validar):

| Fase no portal (HTML) | Etapas do passo a passo |
|---|---|
| 1. Documentação | 1. Autuação |
| 2. Análise | 2. Guia de vistoria + 3. Análise técnica e vistoria |
| 3. Resposta | 3. Comunique-se e respostas |
| 4. Compromisso das Partes | 4. Câmara de Compensação / TCA + 5. Cláusulas do TCA |
| 5. Manejo | 6. Manejo / corte |
| 6. Construção | período entre manejo e plantio (não descrito no passo a passo) |
| 7. Compensação | 7. Compensação e encerramento (CRP, manutenção, Certificado Definitivo) |

**Decisão de produto:** o portal do cliente mostra a fase macro e o **próximo prazo crítico** dela. A visão interna da Eco Direito mostra todos os sub-prazos.

---

## 2. De onde vêm as publicações (descoberta crítica)

### 2.1 SVMA → DOC-SP

Exemplos reais encontrados no DOC-SP de **27 e 28/10/2026** (órgão *Secretaria Municipal do Verde e do Meio Ambiente*, unidade *Termo de Compromisso Ambiental*):

- **Despacho Autorizatório.** Traz o processo SEI, o nome e CNPJ do interessado, o endereço, o nº do parecer técnico, a quantidade de árvores, as mudas convertidas em FEMA e a reunião da Câmara de Compensação que decidiu.
- **Extrato do TCA.** Traz o nº do TCA, o processo SEI, o processo SMUL, a empresa, o CNPJ e o endereço. Publica só a Cláusula 1 e a eficácia. **As cláusulas 9.3, 9.5 e 9.7 não saem no DOC**: precisam ser cadastradas a partir do TCA completo no SEI.
- **Extrato de Aditivo**, **Certificado de Recebimento Provisório e Definitivo**.
- **Comunique-se.** Traz o processo, o interessado e as exigências, e muitas vezes **o próprio prazo escrito no texto**. Exemplos: "60 dias contados a partir da data da publicação no DOC" e "90 dias corridos… excluindo-se o dia de início e incluindo-se o dia de vencimento".

Todo item publicado tem os campos estruturados **veículo, órgão, unidade, série (tipo do ato), processo SEI, nº do documento e link**. Isso permite fazer o *matching* pelo número do processo, sem depender de texto livre.

### 2.2 TJSP → DJEN

- O portal `dje.tjsp.jus.br/cdje/consultaAvancada.do` não recebe edições desde **22/07/2025** (campo `dtLimiteFim=2025-07-22` na página). Serve só como arquivo histórico.
- O caderno administrativo foi para o **Dejesp** em 23/07/2025.
- Desde **16/05/2025** os prazos de intimações do TJSP correm da publicação no **DJEN**. Citações e intimações pessoais de empresas (por CNPJ) vão para o **Domicílio Judicial Eletrônico**, não para o DJEN.

### 2.3 Por que apareceu "TJSP" e "licitações"? (validar com a Eco Direito)

Hipóteses, em ordem de probabilidade:

1. **Confusão de diários.** O que dispara os prazos do passo a passo é o **DOC-SP**, e "TJSP" foi um engano de quem repassou.
2. **A Eco Direito também tem processos judiciais.** Exemplos: execução de TCA (o TCA é título executivo), ações civis públicas ambientais, defesas de autos de infração. Nesse caso o **DJEN** entra como segunda fonte.
3. **"Licitações" literalmente.** A Eco Direito disputaria licitações públicas de plantio ou manejo. Nesse caso a fonte seria outra, por exemplo o PNCP (Portal Nacional de Contratações Públicas, que tem API de consulta pública) ou o próprio DOC-SP. **Essa fonte não foi pesquisada a fundo.**

---

## 3. Fontes de dados avaliadas

| Fonte | O que é | Acesso | Custo | Veredito |
|---|---|---|---|---|
| **DOC-SP — Diário Aberto** | Download diário da edição inteira (CSV ~0,9 MB, JSON ~10 MB com o conteúdo HTML de cada ato) | GET público, sem captcha, sem login (testado) | grátis | ✅ **Fonte principal** |
| **DOC-SP — busca de matérias** | Busca por frase, período, tipo de ato e órgão/unidade | POST simples, sem captcha (testado) | grátis | ✅ Para carga retroativa e verificações |
| **DJEN — Comunica API (CNJ)** | Todas as comunicações judiciais, com texto integral | REST pública, sem auth; ~20 req por janela por IP; teto de 10 mil resultados por consulta (testado) | grátis | ✅ **Se houver processos judiciais** |
| DJE TJSP (`dje.tjsp.jus.br`) | Diário antigo do TJSP | Formulário HTML | grátis | ❌ Congelado desde 22/07/2025 |
| DataJud (CNJ) | Metadados e códigos de movimento dos processos, sem texto | Elasticsearch com chave pública | grátis | ❌ Instável nos testes (429/504), sem texto, termos de uso "não comerciais" |
| SEI / Portal de Processos (Prefeitura SP) | Andamentos e documentos do processo administrativo | **Captcha** em todas as consultas | grátis | ❌ Não automatizar; consulta manual |
| Querido Diário (OKBR) | API de diários municipais | REST pública | grátis | ❌ Cobertura de SP capital parada em 03/2025 |
| **GeckoAPI** | Scraper genérico (46 fontes de e-commerce, imóveis, vagas etc.) | REST + MCP, sem webhooks | R$127–1.000/mês | ❌ **Não cobre tribunal nem diário oficial**; empresa aberta em 04/2026 |
| Escavador API | Monitoramento de diários por termo e de processos por nº, com callback | REST, créditos | sob consulta | 🟡 Único pago que vale um *trial*; checar se cobre o DOC-SP (`GET origens`) |
| Judit | Monitoramento de processos (inclusive via DJEN) com webhook | REST | a partir de ~R$1 mil/mês | 🟡 Só se o volume judicial justificar |
| Infosimples | Consulta pontual ao TJSP 1º grau (pull) | REST | R$0,09–0,20/consulta, mínimo R$100/mês | 🟡 Complemento eventual |

**Recomendação:** o MVP não precisa de fornecedor pago. O DOC-SP é uma única fonte pública, oficial e estruturada, e o DJEN é uma API oficial gratuita. Um fornecedor pago só faz sentido se a Eco Direito precisar monitorar muitas fontes além dessas duas.

### 3.1 Detalhes técnicos das fontes escolhidas

**DOC-SP (ePubli/SEI, edições desde 01/03/2023):**

```
# Edição do dia (formato: csv | json | xml | html | pdf)
GET https://diariooficial.prefeitura.sp.gov.br/md_epubli_controlador.php?acao=edicao_download&dta=27%2F10%2F2026&formato=csv

# Colunas do CSV
Veículo;Órgão;Unidade;Série;Processo;Documento;Link
"Atos do Executivo";"Secretaria Municipal do Verde e do Meio Ambiente";"Termo de Compromisso Ambiental";"Despacho Autorizatório";6027.2024/0024839-8;167554380;https://...
```

- As edições saem de segunda a sexta. Nos fins de semana o endpoint retorna HTTP 500, o que é esperado e deve ser tratado.
- O JSON vem com um `;` no final, que precisa ser removido antes do parse.
- Não há API documentada nem SLA. O formato pode mudar sem aviso, então **é preciso monitorar a saúde do coletor**.
- Parece haver um "clipping" por e-mail por termo no portal (não testado). Pode servir de redundância.

**DJEN — Comunica API** (spec: `https://comunicaapi.pje.jus.br/swagger/djen.yml`):

```
GET https://comunicaapi.pje.jus.br/api/v1/comunicacao
    ?siglaTribunal=TJSP&numeroProcesso=...&dataDisponibilizacaoInicio=2026-10-27
    &dataDisponibilizacaoFim=2026-10-27&itensPorPagina=100&pagina=1
# outros filtros: texto, nomeParte, nomeAdvogado, numeroOab+ufOab, meio (D|E)

GET https://comunicaapi.pje.jus.br/api/v1/caderno/TJSP/2026-10-27/D   # zip do dia inteiro (~98 MB), link válido por 5 min, disponível a partir das 03:00
```

- Cada item traz `id`, `data_disponibilizacao`, `tipoComunicacao`, `nomeOrgao`, `numero_processo`, `nomeClasse`, `texto` (íntegra), `destinatarios[]`, `destinatarioadvogados[]` e `hash`.
- **Não há campo nem filtro de CNPJ.**
- Rate limit de ~20 requisições por IP. Depois de um 429, esperar 1 minuto. Usar vários IPs é tratado como abuso.
- Não foi confirmado se há bloqueio para fora do Brasil. **Hospedar os jobs em região São Paulo** (Vercel `gru1` / AWS `sa-east-1`).

---

## 4. Regras de contagem de prazo

### 4.1 Prazos administrativos municipais (SVMA / DOC-SP)

**Lei Municipal 14.141/2006, art. 40:**

- Os prazos contam **a partir da publicação no DOC**, **excluindo o dia do início e incluindo o do fim**.
- São contados **de forma contínua (dias corridos)** (§2º).
- Se o vencimento cair em dia sem expediente, **prorroga para o primeiro dia útil seguinte** (§1º).
- Os prazos **não se suspendem**, salvo força maior comprovada (§3º).

**Exceções vistas na prática:**

- Prazos escritos no próprio ato. Exemplos: "60 dias contados da publicação", "90 dias corridos".
- Alguns Comunique-se contam "a partir do dia seguinte ao recebimento".
- O Dec. 61.859/2022 usa "10 dias úteis" para avisos à Subprefeitura.
- Recurso ou reconsideração: **15 dias** da publicação (Port. 105, arts. 7º e 85).

### 4.2 Prazos judiciais (TJSP via DJEN)

- Os prazos são em **dias úteis** (CPC, art. 219).
- A **publicação** é o 1º dia útil após a `data_disponibilizacao`. O prazo **começa no dia útil seguinte** à publicação (Lei 11.419/2006, art. 4º; CPC, art. 224).
- É preciso ter um calendário de feriados (nacional, estadual SP, municipal) e das suspensões do TJSP.

### 4.3 Divergências: passo a passo × Portaria SVMA 105/2024 (validar)

| Item | Passo a passo | Portaria 105/2024 | Risco |
|---|---|---|---|
| Entrega do Alvará de Execução à SVMA | 30 dias **da publicação** | 30 dias **da emissão** (art. 51, §2º) | **Contar da publicação pode perder o prazo** |
| Relatório de Manejo/Corte | 30 dias após o corte | comunicar o término **em até 20 dias** (art. 57, §1º, b) | **Prazo real pode ser 10 dias menor** |
| Aviso de Início de Plantio | "10 dias de antecedência **ao corte**" | — | Provável erro de digitação ("ao plantio") |
| Validade do parecer conclusivo | não menciona | 18 meses; renovar ≥30 dias antes (art. 19) | Prazo esquecido |
| Rescisão do TCA | não menciona | Rescinde se o Alvará não sair em 2 anos da publicação do extrato (art. 53) | Prazo esquecido |
| Convocações da SVMA | não menciona | Primeiro por **e-mail** (10 dias, repetido uma vez); só depois pelo DOC, com 5 dias (art. 58) | Prazo que **não aparece no diário** |

> A cláusula assinada no TCA de cada processo pode ser diferente da Portaria. Por isso **cada prazo guarda a regra usada e a base legal**, e as regras ficam num cadastro editável.

---

## 5. Arquitetura proposta

```
FONTES                      COLETA (jobs diários)        PROCESSAMENTO                     SAÍDAS
─────────────────────────   ─────────────────────────    ──────────────────────────────    ─────────────────────────
DOC-SP Diário Aberto  ───┐
 (CSV/JSON do dia)       │
                         ├─▶ Coletores                ─▶ Normalização + dedupe       ─▶ Caixa de entrada
DJEN Comunica API     ───┘   (agendados, com retry       ─▶ Matching (nº SEI, nº CNJ,       (revisão humana:
 (TJSP, se aplicável)         e alerta de falha)            CNPJ, nome, endereço)           vincular / ignorar)
                                                          ─▶ Classificação (série do ato           │
                                                             → tipo de evento; extração            │ confirma evento
                                                             do prazo do texto)                    ▼
Lançamento manual  ─────────────────────────────────────────────────────────────────▶  Motor de prazos
 (SEI, e-mail SVMA, vistoria, corte, plantio)                                            (regras + feriados)
                                                                                                   │
                                                          Dashboard interno · Alertas (e-mail/WhatsApp) · Portal do cliente
```

### 5.1 Stack sugerida

| Camada | Escolha | Por quê |
|---|---|---|
| App | **Next.js (App Router) + TypeScript + Tailwind + shadcn/ui** | Pedido do projeto; back-office e portal no mesmo app |
| Banco / Auth / Storage | **Supabase (Postgres)** + Drizzle ORM | Auth com papéis, RLS para o portal do cliente e storage de documentos num só serviço |
| Jobs agendados | **Vercel Cron** para disparar + **Trigger.dev ou Inngest** para os jobs longos | O JSON do DOC-SP (~10 MB) e o rate limit do DJEN pedem retries, throttling e execuções que passam do timeout de uma função serverless |
| Região | **São Paulo** (`gru1` / `sa-east-1`) | Latência e possível bloqueio geográfico das fontes oficiais |
| E-mail | Resend + React Email | Alertas e resumo diário |
| WhatsApp | Fase posterior (Meta Cloud API / Z-API / Twilio) | Canal que o cliente provavelmente prefere |
| IA (opcional) | LLM (ex.: Claude Haiku) para **extrair o prazo e o tipo de exigência** do texto de um Comunique-se | Sempre com confirmação humana; nunca cria prazo sozinho |

### 5.2 Princípios

- **Humano no circuito.** A publicação encontrada vira **sugestão** de evento, e alguém confirma. Perder um prazo é responsabilidade profissional.
- **Regras como dados.** Templates de processo com etapas e regras de prazo no banco, não fixos no código. Hoje há um template ("SVMA — Manejo com TCA"); amanhã pode haver outros (CETESB, judicial, licitação).
- **Rastreabilidade.** Cada prazo guarda o evento de origem, o link da publicação, a regra aplicada, a base legal e quem confirmou.
- **Falha barulhenta.** Se o coletor não processar uma edição num dia útil, o sistema alerta a equipe. Silêncio nunca pode significar "não saiu nada".

---

## 6. Modelo de dados (rascunho)

```
Organizacao (Eco Direito)            Usuario (papel: admin | equipe | cliente_externo)
Cliente (empreendedor/construtora)   ─┬─ Projeto/Empreendimento (endereço, subprefeitura)
                                      └─ Processo (tipo/template, nº SEI SVMA, nº SMUL, nº TCA,
                                                    nº Alvará, CNPJ interessado, status)
ProcessoTemplate ─ EtapaTemplate ─ RegraPrazo (gatilho, offset, unidade: dias_corridos|dias_uteis|meses,
                                              direção: depois|antes, prorroga_dia_util, tipo, base_legal)
Etapa (instância por processo: status, datas)
Evento/Marco (tipo, data, origem: publicacao|manual, publicacao_id, confirmado_por)
Prazo (regra_id, evento_id, data_inicio, data_fim, tipo, status, responsável, cálculo explicado)
Publicacao (fonte, data, órgão, unidade, série, nº processo, documento, link, texto, hash,
            status_match: novo|vinculado|ignorado, processo_id)
AlvoMonitoramento (nº processo, CNPJ, nome, endereço → processo_id)
Feriado (data, abrangência: nacional|estadual|municipal|tjsp, descrição)
Documento (anexos: comprovantes, relatórios fotográficos, TCA, ART)
Notificacao · AuditLog
```

---

## 7. Funcionalidades e telas

**Back-office (equipe Eco Direito):**

- **Painel de prazos:** vencidos, hoje, próximos 7, 10 e 30 dias. Filtros por cliente, responsável e tipo.
- **Projetos e processos:** cadastro e timeline das 7 etapas com todos os sub-prazos.
- **Caixa de entrada de publicações:** o que o robô achou no dia, com os botões vincular, confirmar evento e ignorar.
- **Lançamento de eventos manuais:** guia emitida, vistoria, corte, plantio, e-mail da SVMA.
- **Calendário,** com exportação iCal.
- **Cadastros:** clientes, templates, regras e feriados.
- **Alertas:** e-mail com resumo diário e lembretes em D-10, D-5, D-1 e no vencimento (o mockup já usa "≤10 dias" como amarelo). Escalonamento para o gestor quando vencer.

**Portal do cliente final** (o `Processo_Projeto_XYZ.html` virando produto):

- Somente leitura, por projeto, com login simples ou link mágico.
- Mostra a fase macro, o progresso, o próximo prazo crítico e, opcionalmente, o histórico de publicações.

---

## 8. Roadmap

Estimativas grosseiras para **1 dev em tempo integral**, a refinar depois da Fase 0.

| Fase | Escopo | Duração | Entregável |
|---|---|---|---|
| **0. Validação** | Reunião com a Eco Direito (perguntas do §10); coletar 3–5 publicações reais que dispararam prazo; lista de processos ativos; validar o mapeamento HTML × etapas e as divergências do §4.3 | 3–5 dias | Escopo fechado + regras de prazo validadas |
| **1. MVP de gestão de prazos** | Setup (Next.js, Supabase, auth, papéis); cadastros; template SVMA com regras; motor de prazos com feriados; painel de prazos; lançamento manual de eventos; alertas por e-mail; portal do cliente | 3–4 semanas | A Eco Direito já opera os prazos no sistema, com eventos lançados à mão |
| **2. Monitoramento do DOC-SP** | Coletor diário (CSV + JSON); carga retroativa via busca; matching por nº SEI e CNPJ; classificação por série; caixa de entrada; alerta de falha do coletor | ~2 semanas | Publicações da SVMA chegam sozinhas e viram eventos com um clique |
| **3. DJEN / TJSP** (se confirmado) | Coletor por nº de processo e OAB; regras de prazo em dias úteis; calendário do TJSP | ~1 semana | Intimações judiciais no mesmo painel |
| **4. Evolução** | WhatsApp; extração por IA dos prazos no texto; relatórios; novos templates (outros órgãos, licitações); importação de planilhas | contínuo | — |

---

## 9. Riscos e mitigação

| Risco | Mitigação |
|---|---|
| O DOC-SP não tem API oficial; o endpoint ou o formato podem mudar | Coletor com testes de contrato, alerta quando a edição do dia não é processada, busca manual como fallback e, se precisar, o clipping por e-mail do portal |
| Perder um prazo por falha do sistema | Humano no circuito, alertas redundantes, painel "o que vence hoje", log de auditoria. O sistema é um apoio, não substitui a conferência |
| As cláusulas do TCA não são publicadas | Cadastro manual das cláusulas e datas ao receber o TCA (do SEI); checklist por TCA |
| Prazos que não passam pelo diário (e-mails da SVMA, guias, vistorias) | Lançamento manual rápido. Futuro: caixa de e-mail monitorada |
| SEI com captcha | Não automatizar; a equipe consulta manualmente. Não construir quebra de captcha |
| Rate limit e possível bloqueio geográfico do DJEN | Consultas por processo com throttling; download do caderno diário se o volume crescer; jobs na região SP |
| Regra de contagem errada | Regras editáveis com base legal, cálculo explicado na tela e validação com a Eco Direito na Fase 0 |
| LGPD | As publicações têm dados pessoais. Guardar só o necessário, controlar acesso por papel e definir uma política de retenção |
| Escopo "TJSP / licitações" indefinido | Resolver na Fase 0 antes de construir coletores além do DOC-SP |

---

## 10. Perguntas para a Eco Direito (Fase 0)

1. **Qual publicação dispara o prazo hoje?** Pedir 3–5 exemplos reais (print ou link). São do DOC-SP, do TJSP ou de outro lugar?
2. A Eco Direito tem **processos judiciais** (execução de TCA, ações ambientais, autos de infração)? Há advogado com OAB cujas intimações devamos monitorar?
3. O que significa **"licitações"** no fluxo deles? Participam de licitações públicas? Em quais portais?
4. Como controlam isso **hoje**: planilha, agenda, sistema? Dá para importar o histórico?
5. Quantos **processos ativos**, quantas **pessoas** na equipe, e **quem recebe** cada alerta? Por **e-mail ou WhatsApp**?
6. O **portal do cliente final** é desejado? O que pode e o que não pode ser mostrado ao empreendedor?
7. Validar as divergências do §4.3. O Alvará conta da **emissão** ou da **publicação**? O relatório de manejo é em **20 ou 30 dias**? As cláusulas 9.x são iguais em todos os TCAs?
8. Eles acompanham também o processo na **SMUL** (o Alvará de Execução)? Têm acesso ao SEI como usuário externo?
9. Há outros órgãos ou tipos de processo além da SVMA (CETESB, DEPRN, outras prefeituras)?
10. Orçamento para hospedagem e eventuais APIs pagas (Escavador/Judit), se for preciso.

---

## 11. Referências

- DOC-SP: https://diariooficial.prefeitura.sp.gov.br
- DJEN Comunica API (spec): https://comunicaapi.pje.jus.br/swagger/djen.yml
- DataJud, API pública: https://datajud-wiki.cnj.jus.br/api-publica/
- Comunicado Conjunto TJSP 371/2025 (DJEN a partir de 16/05/2025): https://portal.tjsp.jus.br/Corregedoria/Comunicados/Comunicado?codigoComunicado=52007&pagina=30
- Notícia do TJSP sobre o Dejesp: https://www.tjsp.jus.br/Noticias/Noticia?codigoNoticia=108706
- Portaria SVMA 105/2024: https://legislacao.prefeitura.sp.gov.br/portaria-secretaria-municipal-do-verde-e-do-meio-ambiente-svma-105-de-14-de-novembro-de-2024
- Lei Municipal 14.141/2006 (processo administrativo, art. 40): https://legislacao.prefeitura.sp.gov.br/leis/lei-14141-de-27-de-marco-de-2006
- Lei Municipal 17.794/2022 (arborização), Dec. 61.859/2022, Dec. 53.889/2013 (TCA): https://legislacao.prefeitura.sp.gov.br
- Portal de Processos da Prefeitura (com captcha): https://processos.prefeitura.sp.gov.br/Forms/consultarProcessos.aspx
- GeckoAPI: https://geckoapi.com.br/apis/ · preços: https://geckoapi.com.br/precos/
- Escavador API: https://api.escavador.com/v2/docs/ · Judit: https://judit.io/planos-api/ · Infosimples TJSP: https://infosimples.com/consultas/tribunal-tjsp-primeiro-grau/
- Querido Diário: https://docs.queridodiario.ok.org.br

# Diário Oficial (publicações)

Arquivos: `src/domain/publicacoes.ts`, `src/data/publicacoes.ts`, `src/app/(app)/publicacoes/`.
A caixa de entrada mostra o que está na tabela `publicacoes` (ou os atos fictícios, sem banco). O robô baixa e grava sob demanda; o agendamento diário ainda não existe.

## Caixa de entrada (E3)

Abas: Para revisar (`nova`), Lançados (`confirmada`) e Ignorados (`descartada`); na URL, `?aba=` usa o status. No topo de "Para revisar": "O robô lê o Diário Oficial e traz os atos que parecem ser dos nossos clientes. Para cada um, decida: lançar no processo (marca a etapa e conta o prazo) ou ignorar."

- **Dois grupos** em "Para revisar": "De processos que já acompanhamos" (achados pelo nº SEI ou SIMPROC) e "De clientes, mas o processo ainda não está cadastrado" (achados só pelo CNPJ). A página corta a lista com os primeiros antes; os grupos separam o que está nela.
- **Por que o ato está ali**, em cada linha: "Achado pelo nº SEI do processo X." / "Achado pelo nº SIMPROC do processo X, escrito no texto do ato." / "Achado pelo CNPJ do cliente, escrito no texto do ato. O processo deste ato (SEI ...) ainda não está cadastrado."
- **O que lançar faz**: "Ao lançar: marca a etapa “X” e abre o prazo “Y” até ...". Série que não vira etapa: "Este tipo de ato não marca etapa: marcar como visto registra só que ele é nosso."
- **Botões** (só quem edita prazos):
  - Com processo: "Lançar no processo" (ou "Marcar como visto", se a série não vira etapa) e "Ignorar".
  - Sem processo: "Cadastrar o processo e lançar" (ou "Cadastrar o processo") e "Ignorar".
- **Lançar**: o ato vira o evento (`eventoDoAto`; data do ato, origem `diario`). Evento, fase do processo e status do ato vão num único `db.batch` (transação). O evento tem id fixo `diario-<id do ato>`: dois lançamentos ao mesmo tempo gravam um só. Série sem evento só fica `confirmada` (aparece como "Visto").
- **Cadastrar o processo e lançar**: abre `/processos/novo?ato=<id>` com cliente, nº SEI e fase preenchidos. Ao salvar, `salvarProcesso` chama `lancarNoProcessoNovo` e volta para `/publicacoes?lancado=<id do ato>`, que mostra "Processo cadastrado e ato lançado. Abrir o processo". Só lança se o nº SEI do processo for o do ato (é por ele que a caixa liga os dois depois); com outro SEI, o processo é criado e o ato continua para revisar, com aviso.
- **Ignorar**: motivo numa lista (`MOTIVOS_PARA_IGNORAR`: "Não é processo nosso", "Já foi lançado", "Não muda nada no processo") ou "Outro (escrever)". Grava o texto do motivo; a aba Ignorados mostra.
- **Prazo escrito no ato** (`prazoDoAto` → `diasNoAto`): só no Comunique-se e só na frase "prazo de (até) N dias". Em extrato e despacho, "N dias" costuma ser vigência ou validade e alongaria o prazo da cláusula. "Dias úteis" é lido como corridos (só antecipa).
- Limite conhecido: o vínculo é recalculado a cada leitura. Se o CNPJ ou o nº SEI de um cadastro mudar depois da importação, o ato gravado pode sumir da caixa.
- Só atos com status `nova` mudam: a action recusa ato já revisado ("Este ato já foi revisado").
- **Busca** (`?q=`): texto e série do ato, nº SEI (do ato e do processo), cliente, grupo e empreendimento. Vale nas três abas, e o contador de cada aba mostra o resultado da busca.

## Fonte (conferida em 02/11/2026 com as edições de 23, 27 e 29/10)

- DOC-SP "Diário Aberto": download da edição do dia, gratuito e sem captcha.
  `https://diariooficial.prefeitura.sp.gov.br/md_epubli_controlador.php?acao=edicao_download&dta=DD%2FMM%2FAAAA&formato=csv|json`
- Colunas: Veículo, Órgão, Unidade, Série, Processo (nº SEI), Documento, Link. Usamos o JSON (`{"edicao":[...]}` seguido de `;`, UTF-8, ~15 MB, ~2 s): só ele traz o texto (`conteudo`, em HTML com entidades). O CSV é ISO-8859-1 e não tem texto.
- Cerca de 2.800 atos por edição, 60 a 100 da Secretaria do Verde. O nº do documento é único; o link muda a cada download (não serve de chave).
- Sem edição (HTTP 500) no fim de semana, feriado e ponto facultativo. Ex.: 30/10/2026, Dia do Servidor transferido pela Prefeitura, não teve edição e não está em `feriados.ts`. Edições desde 01/03/2023.
- SEI e Portal de Processos têm captcha: não automatizar.

## Coletor (E5, `src/robo/doc-sp.ts`)

- `baixarEdicao(data)`: baixa o JSON e devolve `{ totalAtos, atos }` só com os atos da SVMA (órgão exato, a "Subprefeitura da Casa Verde" fica de fora), ou `undefined` se não houve edição. Outra resposta ruim, ou formato diferente do esperado (validado com Zod), lança erro: falha barulhenta.
- Id do ato: `doc-<data>-<documento>` (a tabela tem unique em data + documento; gravar com `onConflictDoNothing`).
- Texto: HTML vira um parágrafo por linha, entidades decodificadas sem dependência nova (`htmlParaTexto`).
- Testes com uma edição fictícia no formato real. O arquivo real nunca entra no repositório (pode citar clientes).
- `importarEdicao(data)` (`src/data/publicacoes.ts`): grava na caixa de entrada só os atos que `vincularAto` liga a cliente ou processo e registra a edição em `edicoes_diario`. Dia útil sem edição grava a linha com `erro`, para conferir (pode ser ponto facultativo).
- Botão "Buscar no Diário" em `/publicacoes` (quem edita prazos): escolhe o dia, já vem no último dia útil. Falha do download aparece na tela.
- A caixa de entrada mostra "Abrir no Diário Oficial" (link gravado pelo robô; os atos fictícios não têm) e o cartão "Edição lida" mostra a hora da leitura ou o `erro` da edição.
- Falta: agendar todo dia útil às 6h (`src/app/api/robo/**`, sem `carregar()`: ler o db direto e proteger com `CRON_SECRET`) e alerta de falha por e-mail (E7).

## Evento sugerido (`eventoDoAto`)

- Série `Comunique-se` → `comunique_se`; `Despacho Autorizatório` → `parte_tecnica_aprovada`.
- Série `Extrato` serve para três atos; o começo do texto decide: "EXTRATO DO TERMO DE COMPROMISSO AMBIENTAL" → `tca_publicado`; "RECEBIMENTO PROVISÓRIO" → `crp_emitido`; "RECEBIMENTO DEFINITIVO" → `certificado_definitivo`. Extrato de aditivo (série "Extrato do Termo Aditivo") e de contrato não viram evento.

## Como o robô acha os atos (ordem)

1. Filtra os atos da Secretaria do Verde.
2. **Nº SEI** da coluna Processo bate com um processo cadastrado. Ato com a coluna vazia pula este passo (não casa com processo ainda sem SEI).
3. **Nº SIMPROC** no texto do ato (processos antigos: a coluna traz outro número SEI).
4. **CNPJ ou nome** de um cliente cadastrado no texto: processo ainda não cadastrado.

## Regras

- Humano no circuito: o robô só sugere. Alguém lança, e só então o evento entra e gera prazos.
- Falha barulhenta: se a edição de um dia útil não for processada, a equipe recebe um alerta.
- O ato sugere um tipo de evento (`eventoDoAto`, acima); quem revisa pode ignorar.
- DJEN (Justiça) só entra se a Eco Direito tiver processos judiciais.

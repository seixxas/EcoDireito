# Diário Oficial (publicações)

Arquivos: `src/domain/publicacoes.ts`, `src/data/publicacoes.ts`, `src/app/(app)/publicacoes/`.
A caixa de entrada mostra o que está na tabela `publicacoes` (ou os atos fictícios, sem banco). O robô baixa e grava sob demanda; o agendamento diário ainda não existe.

## Caixa de entrada (E3)

- **Confirmar**: a série do ato vira o evento (data do ato, origem `diario`, prazo escrito no texto em `diasNoAto`). Evento, fase do processo e status do ato vão num único `db.batch` (transação). Série sem evento (ex.: Notificação) só fica confirmada.
- **Não é nosso**: descarta com motivo obrigatório.
- **Sem processo cadastrado** (achado pelo CNPJ): "Cadastrar processo" abre `/processos/novo?ato=<id>` com cliente, nº SEI e fase preenchidos e volta para a caixa; o ato passa a casar pelo SEI e pode ser confirmado.
- Só atos com status `nova` mudam: a action recusa ato já revisado ("Este ato já foi revisado").

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
2. **Nº SEI** da coluna Processo bate com um processo cadastrado.
3. **Nº SIMPROC** no texto do ato (processos antigos: a coluna traz outro número SEI).
4. **CNPJ ou nome** de um cliente cadastrado no texto: processo ainda não cadastrado.

## Regras

- Humano no circuito: o robô só sugere. Alguém confirma, e só então o evento entra e gera prazos.
- Falha barulhenta: se a edição de um dia útil não for processada, a equipe recebe um alerta.
- O ato sugere um tipo de evento (`eventoDoAto`, acima); quem confirma pode descartar.
- DJEN (Justiça) só entra se a Eco Direito tiver processos judiciais.

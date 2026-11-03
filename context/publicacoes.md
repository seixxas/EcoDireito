# Diário Oficial (publicações)

Arquivos: `src/domain/publicacoes.ts`, `src/data/publicacoes.ts`, `src/app/(app)/publicacoes/`.
O robô real ainda não existe (E5): a caixa de entrada mostra o que está na tabela `publicacoes` (ou os atos fictícios, sem banco).

## Caixa de entrada (E3)

- **Confirmar**: a série do ato vira o evento (data do ato, origem `diario`, prazo escrito no texto em `diasNoAto`). Evento, fase do processo e status do ato vão num único `db.batch` (transação). Série sem evento (ex.: Notificação) só fica confirmada.
- **Não é nosso**: descarta com motivo obrigatório.
- **Sem processo cadastrado** (achado pelo CNPJ): "Cadastrar processo" abre `/processos/novo?ato=<id>` com cliente, nº SEI e fase preenchidos e volta para a caixa; o ato passa a casar pelo SEI e pode ser confirmado.
- Só atos com status `nova` mudam: a action recusa ato já revisado ("Este ato já foi revisado").

## Fonte (testada em 28/10/2026)

- DOC-SP "Diário Aberto": download da edição do dia, gratuito e sem captcha.
  `https://diariooficial.prefeitura.sp.gov.br/md_epubli_controlador.php?acao=edicao_download&dta=DD%2FMM%2FAAAA&formato=csv|json`
- Colunas: Veículo, Órgão, Unidade, Série, Processo (nº SEI), Documento, Link. O JSON traz o texto do ato e termina com `;`.
- Sem edição no fim de semana (HTTP 500). Edições desde 01/03/2023.
- SEI e Portal de Processos têm captcha: não automatizar.

## Como o robô acha os atos (ordem)

1. Filtra os atos da Secretaria do Verde.
2. **Nº SEI** da coluna Processo bate com um processo cadastrado.
3. **Nº SIMPROC** no texto do ato (processos antigos: a coluna traz outro número SEI).
4. **CNPJ ou nome** de um cliente cadastrado no texto: processo ainda não cadastrado.

## Regras

- Humano no circuito: o robô só sugere. Alguém confirma, e só então o evento entra e gera prazos.
- Falha barulhenta: se a edição de um dia útil não for processada, a equipe recebe um alerta.
- A série do ato vira o tipo de evento sugerido (Comunique-se → `comunique_se`, Extrato do TCA → `tca_publicado`).
- DJEN (Justiça) só entra se a Eco Direito tiver processos judiciais.

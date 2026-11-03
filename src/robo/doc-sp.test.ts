import { describe, expect, it } from 'vitest'
import { baixarEdicao, htmlParaTexto, lerEdicao, urlDaEdicao } from './doc-sp'

/** Edição fictícia no formato do download real (barras escapadas, HTML com entidades, ";" no fim). */
const linha = (orgao: string, serie: string, documento: string, conteudo: string) => ({
  veiculo: 'Atos do Executivo',
  orgao,
  unidade: 'Termo de Compromisso  Ambiental',
  serie,
  processo: '6027.2026/0000021-3',
  documento,
  link: `https://diariooficial.prefeitura.sp.gov.br/md_epubli_visualizar.php?${documento}`,
  conteudo,
})

const EDICAO =
  JSON.stringify({
    edicao: [
      linha('Gabinete do Prefeito', 'Decreto', '100', '<p>DECRETO</p>'),
      linha('Subprefeitura da Casa Verde / Cachoeirinha', 'Despacho', '101', '<p>DESPACHO</p>'),
      linha(
        'Secretaria Municipal do Verde e do Meio Ambiente',
        'Comunique-se',
        '102',
        '<div><p><!--style="margin:0"--> </p>\r\n<p class="x"><b>COMUNIQUE-SE</b> - SEI n&deg; 6027.2026/0000021-3</p>\r\n<p>Interessado: AURORA EMPREENDIMENTOS SPE LTDA, CNPJ 12.345.678/0001-95. Apresentar, no prazo de 30 (trinta) dias, a revis&atilde;o do levantamento arb&oacute;reo e a &ldquo;anu&ecirc;ncia&rdquo; do condom&iacute;nio.</p></div>',
      ),
      linha('Secretaria Municipal do Verde e do Meio Ambiente', 'Extrato', '103', '<p>CERTIFICADO AMBIENTAL RECEBIMENTO PROVIS&Oacute;RIO DO TCA n&ordm; 406/2024</p>'),
    ],
  }).replaceAll('/', '\\/') + ';\n'

describe('lerEdicao', () => {
  const edicao = lerEdicao(EDICAO, '2026-10-29')

  it('conta a edição inteira e fica só com a Secretaria do Verde', () => {
    expect(edicao.totalAtos).toBe(4)
    expect(edicao.atos.map((a) => a.documento)).toEqual(['102', '103'])
  })

  it('converte para Ato com id fixo por data e documento', () => {
    expect(edicao.atos[0]).toMatchObject({
      id: 'doc-2026-10-29-102',
      data: '2026-10-29',
      unidade: 'Termo de Compromisso Ambiental',
      serie: 'Comunique-se',
      processo: '6027.2026/0000021-3',
      link: 'https://diariooficial.prefeitura.sp.gov.br/md_epubli_visualizar.php?102',
    })
  })

  it('deixa o texto legível para o vínculo e para a tela', () => {
    expect(edicao.atos[0].texto).toBe(
      'COMUNIQUE-SE - SEI n° 6027.2026/0000021-3\nInteressado: AURORA EMPREENDIMENTOS SPE LTDA, CNPJ 12.345.678/0001-95. Apresentar, no prazo de 30 (trinta) dias, a revisão do levantamento arbóreo e a “anuência” do condomínio.',
    )
    expect(edicao.atos[1].texto).toBe('CERTIFICADO AMBIENTAL RECEBIMENTO PROVISÓRIO DO TCA nº 406/2024')
  })

  it('falha alto se o formato mudar', () => {
    expect(() => lerEdicao('{"atos":[]};', '2026-10-29')).toThrow()
  })
})

describe('htmlParaTexto', () => {
  it('decodifica entidades sem criar tags', () => {
    expect(htmlParaTexto('<p>&lt;b&gt; &Ccedil;&Atilde;O &#8239;&#x41;&amp;&#1042;</p>')).toBe('<b> ÇÃO A&В')
  })

  it('mantém entidade desconhecida como veio', () => {
    expect(htmlParaTexto('a &naoexiste; b')).toBe('a &naoexiste; b')
  })
})

describe('baixarEdicao', () => {
  const resposta = (status: number, corpo = '') => async () => new Response(corpo, { status })

  it('monta a URL com a data no formato do DOC-SP', () => {
    expect(urlDaEdicao('2026-10-29')).toContain('acao=edicao_download&dta=29%2F10%2F2026&formato=json')
  })

  it('devolve a edição lida', async () => {
    expect((await baixarEdicao('2026-10-29', resposta(200, EDICAO)))?.atos).toHaveLength(2)
  })

  it('500 é dia sem edição', async () => {
    expect(await baixarEdicao('2026-10-30', resposta(500))).toBeUndefined()
  })

  it('outra resposta ruim é falha', async () => {
    await expect(baixarEdicao('2026-10-29', resposta(403))).rejects.toThrow('403')
  })
})

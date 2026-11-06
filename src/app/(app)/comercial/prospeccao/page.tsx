import type { Metadata } from 'next'
import { Badge } from '@/components/ui/badge'
import { PageHeader } from '@/components/ui/page-header'
import { ItemResumo, Resumo } from '@/components/ui/resumo'
import { Secao } from '@/components/ui/secao'
import { Situacao } from '@/components/ui/situacao'
import { Item, Zona } from '@/components/ui/zona'
import { exigirArea } from '@/data/sessao'
import { AbasDoComercial } from '../_components/abas-do-comercial'

export const metadata: Metadata = { title: 'Prospecção' }

type Oportunidade = { obra: string; empresa: string; origem: string; quando: string; sinais: string[]; chance: 'alta' | 'media' }

/** Exemplos fixos para apresentar a ideia. Nada aqui vem do banco nem de fonte real. */
const OPORTUNIDADES: Oportunidade[] = [
  {
    obra: 'Altavista Ipiranga',
    empresa: 'Altavista Ipiranga Empreendimento Imobiliário SPE Ltda',
    origem: 'SPE nova de um grupo que já é cliente (Grupo Altavista)',
    quando: 'aberta em 21/10',
    sinais: ['Grupo já é cliente'],
    chance: 'alta',
  },
  {
    obra: 'Residencial Parque Paraíso',
    empresa: 'Incorporadora Vale Alto Ltda',
    origem: 'Alvará de aprovação de edificação nova publicado no Diário Oficial',
    quando: 'publicado em 29/10',
    sinais: ['Terreno com vegetação', 'Alvará novo'],
    chance: 'alta',
  },
  {
    obra: 'Torre Faria Lima 3.500',
    empresa: 'Horizonte Paulista Incorporações',
    origem: 'Lançamento imobiliário anunciado',
    quando: 'anunciado em 25/10',
    sinais: ['Grupo já é cliente', 'Área de manancial'],
    chance: 'media',
  },
  {
    obra: 'Centro logístico Anhanguera',
    empresa: 'Logística Raposo S.A.',
    origem: 'Alvará de aprovação de edificação nova publicado no Diário Oficial',
    quando: 'publicado em 22/10',
    sinais: ['Terreno com vegetação'],
    chance: 'media',
  },
]

const FONTES = [
  ['Diário Oficial', 'O robô que já lê o Diário passa a separar também os alvarás de obras novas e os pedidos de manejo de outras empresas.'],
  ['Cadastro de empresas', 'SPE nova aberta por um grupo que já é cliente (mesma raiz de CNPJ ou mesmo grupo): a chance de fechar é maior.'],
  ['Mapa da Prefeitura (GeoSampa)', 'Mostra se o terreno tem vegetação, área de preservação ou manancial, ou seja, se vai precisar de licenciamento ou manejo.'],
  ['Lançamentos imobiliários', 'Empreendimentos anunciados pelas incorporadoras, antes mesmo do alvará.'],
]

const IDEIAS = [
  'Cada oportunidade vira uma linha com de onde veio, os sinais de que vai precisar da Eco Direito e a chance de fechar.',
  'Um clique cria a proposta já com a empresa e o empreendimento preenchidos (e cadastra o cliente, se for novo).',
  'Oportunidade descartada pede o motivo, para o sistema aprender o que não interessa.',
  'Resumo semanal por e-mail com as oportunidades novas da semana.',
]

/** Prévia da prospecção: só para apresentar a ideia, ainda sem dados reais. */
export default async function PaginaProspeccao() {
  await exigirArea('comercial')

  return (
    <>
      <AbasDoComercial ativa="prospeccao" />
      <PageHeader titulo="Prospecção" resumo="Encontrar projetos e empresas que vão precisar de licenciamento ou manejo, antes de elas procurarem alguém." />

      <p className="mb-6 rounded-lg bg-info-soft px-5.5 py-4.5">
        <strong className="font-semibold text-info">Em desenvolvimento.</strong> Esta tela mostra a ideia com oportunidades de exemplo. Ainda não busca nada e os números abaixo não são reais.
      </p>

      <Resumo className="mb-9">
        <ItemResumo rotulo="Oportunidades novas" valor="12" detalhe="nos últimos 30 dias" />
        <ItemResumo rotulo="De grupos que já são clientes" valor="3" detalhe="chance maior de fechar" />
        <ItemResumo rotulo="Terreno com vegetação" valor="5" detalhe="vão precisar de manejo" />
        <ItemResumo rotulo="Viraram proposta" valor="1" detalhe="neste mês" />
      </Resumo>

      <Zona tom="proximos" titulo="Oportunidades da semana">
        {OPORTUNIDADES.map((o) => (
          <Item
            key={o.obra}
            titulo={o.obra}
            detalhe={
              <>
                {o.empresa} · {o.origem}, {o.quando}
                <span className="mt-2 flex flex-wrap gap-2">
                  {o.sinais.map((sinal) => (
                    <Badge key={sinal} className="bg-brand-100! text-ink!">
                      {sinal}
                    </Badge>
                  ))}
                </span>
              </>
            }
            fim={
              <Situacao tom={o.chance === 'alta' ? 'ok' : 'brand'} className="whitespace-nowrap px-3.5! py-1.5! text-sm!">
                {o.chance === 'alta' ? 'Chance alta' : 'Chance média'}
              </Situacao>
            }
          />
        ))}
        <p className="mb-2 mt-1 text-sm text-muted">Na versão pronta, cada linha terá o botão “Criar proposta”.</p>
      </Zona>

      <Secao titulo="De onde vêm as oportunidades" className="mt-10">
        <dl>
          {FONTES.map(([fonte, como]) => (
            <div key={fonte} className="border-b border-line py-3.5">
              <dt className="font-semibold">{fonte}</dt>
              <dd className="mt-0.5">{como}</dd>
            </div>
          ))}
        </dl>
      </Secao>

      <Secao titulo="O que esta área vai fazer" className="mt-10">
        <ul>
          {IDEIAS.map((ideia) => (
            <li key={ideia} className="border-b border-line py-3.5">
              {ideia}
            </li>
          ))}
        </ul>
      </Secao>
    </>
  )
}

import { Construction } from 'lucide-react'
import type { Metadata } from 'next'
import { Badge } from '@/components/ui/badge'
import { Linha, Lista } from '@/components/ui/lista'
import { PageHeader } from '@/components/ui/page-header'
import { ItemResumo, Resumo } from '@/components/ui/resumo'
import { Secao } from '@/components/ui/secao'
import { Situacao } from '@/components/ui/situacao'
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
  ['Diário Oficial', 'o robô que já lê o Diário passa a separar também os alvarás de obras novas e os pedidos de manejo de outras empresas.'],
  ['Cadastro de empresas', 'SPE nova aberta por um grupo que já é cliente (mesma raiz de CNPJ ou mesmo grupo): a chance de fechar é maior.'],
  ['Mapa da Prefeitura (GeoSampa)', 'mostra se o terreno tem vegetação, área de preservação ou manancial, ou seja, se vai precisar de licenciamento ou manejo.'],
  ['Lançamentos imobiliários', 'empreendimentos anunciados pelas incorporadoras, antes mesmo do alvará.'],
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

      <div className="mb-6 flex items-start gap-3 rounded-lg border border-accent/40 bg-warn-soft px-4 py-3">
        <Construction className="mt-0.5 size-5 shrink-0 text-warn" />
        <p className="text-sm text-ink">
          <strong className="font-semibold">Em desenvolvimento.</strong> Esta tela mostra a ideia com oportunidades de exemplo. Ainda não busca nada e os números
          abaixo não são reais.
        </p>
      </div>

      <Resumo className="mb-8">
        <ItemResumo rotulo="Oportunidades novas" valor="12" detalhe="nos últimos 30 dias" />
        <ItemResumo rotulo="De grupos que já são clientes" valor="3" detalhe="chance maior de fechar" tom="ok" />
        <ItemResumo rotulo="Terreno com vegetação" valor="5" detalhe="vão precisar de manejo" />
        <ItemResumo rotulo="Viraram proposta" valor="1" detalhe="neste mês" />
      </Resumo>

      <Secao titulo="Oportunidades da semana">
        <Lista>
          {OPORTUNIDADES.map((o) => (
            <Linha key={o.obra} className="flex-wrap gap-y-1 sm:flex-nowrap">
              <span className="min-w-0 basis-full sm:basis-auto sm:flex-1">
                <span className="block font-medium text-ink">{o.obra}</span>
                <span className="block truncate text-xs text-muted">
                  {o.empresa} · {o.origem}, {o.quando}
                </span>
              </span>
              <span className="flex flex-wrap gap-1 sm:w-64 sm:justify-end">
                {o.sinais.map((sinal) => (
                  <Badge key={sinal}>{sinal}</Badge>
                ))}
              </span>
              <span className="w-28 shrink-0 text-right">
                <Situacao tom={o.chance === 'alta' ? 'ok' : 'warn'}>{o.chance === 'alta' ? 'Chance alta' : 'Chance média'}</Situacao>
              </span>
            </Linha>
          ))}
        </Lista>
        <p className="mt-2 text-xs text-subtle">Na versão pronta, cada linha terá o botão “Criar proposta”.</p>
      </Secao>

      <Secao titulo="De onde vêm as oportunidades">
        <ul className="space-y-1.5 text-sm text-ink">
          {FONTES.map(([fonte, como]) => (
            <li key={fonte}>
              <strong className="font-medium">{fonte}:</strong> <span className="text-muted">{como}</span>
            </li>
          ))}
        </ul>
      </Secao>

      <Secao titulo="O que esta área vai fazer">
        <ul className="list-disc space-y-1.5 pl-5 text-sm text-ink marker:text-subtle">
          {IDEIAS.map((ideia) => (
            <li key={ideia}>{ideia}</li>
          ))}
        </ul>
      </Secao>
    </>
  )
}

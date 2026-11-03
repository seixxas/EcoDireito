import type { ComponentProps } from 'react'
import { Selecao } from '@/components/ui/form'
import { CONTAS, type GrupoDre } from '@/domain/financeiro/plano-de-contas'

const GRUPOS: Record<GrupoDre, string> = {
  receita: 'Receita',
  imposto: 'Impostos',
  custo: 'Custo dos serviços',
  despesa: 'Despesas operacionais',
  financeiro: 'Resultado financeiro',
  outras: 'Outras receitas',
  fora: 'Fora da DRE',
}

/** Plano de contas agrupado como na DRE. `vazia` é o texto da opção sem conta. */
export function SelecaoConta({ vazia = 'Escolha a conta', ...props }: ComponentProps<'select'> & { vazia?: string }) {
  return (
    <Selecao {...props}>
      <option value="">{vazia}</option>
      {Object.entries(GRUPOS).map(([grupo, nome]) => (
        <optgroup key={grupo} label={nome}>
          {CONTAS.filter((conta) => conta.grupo === grupo).map((conta) => (
            <option key={conta.id} value={conta.id}>
              {conta.nome}
            </option>
          ))}
        </optgroup>
      ))}
    </Selecao>
  )
}

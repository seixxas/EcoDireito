import type { ComponentProps } from 'react'
import { Entrada } from '@/components/ui/form'
import type { Centavos } from '@/lib/dinheiro'

const formato = new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

/** Campo de valor em reais ("1.234,56"). Na action, leia com `campo.dinheiro()`. */
export function EntradaDinheiro({ centavos, ...props }: Omit<ComponentProps<'input'>, 'defaultValue'> & { centavos?: Centavos | string }) {
  const inicial = typeof centavos === 'number' ? formato.format(centavos / 100) : centavos
  return <Entrada inputMode="decimal" placeholder="0,00" autoComplete="off" defaultValue={inicial} {...props} />
}

import { Abas } from '@/components/ui/abas'

export function AbasDoComercial({ ativa }: { ativa: 'propostas' | 'prospeccao' }) {
  return (
    <Abas
      ativa={ativa}
      abas={[
        { valor: 'propostas', rotulo: 'Propostas', href: '/comercial' },
        { valor: 'prospeccao', rotulo: 'Prospecção (em breve)', href: '/comercial/prospeccao' },
      ]}
    />
  )
}

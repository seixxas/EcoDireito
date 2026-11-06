import type { Metadata } from 'next'
import { Atkinson_Hyperlegible_Next } from 'next/font/google'
import type { ReactNode } from 'react'
import './globals.css'

/** Fonte feita para quem enxerga pouco: letras e números difíceis de confundir. */
const atkinson = Atkinson_Hyperlegible_Next({ variable: '--font-atkinson', subsets: ['latin', 'latin-ext'], weight: ['400', '500', '700', '800'] })

export const metadata: Metadata = {
  title: { default: 'Eco Direito', template: '%s · Eco Direito' },
  description: 'Prazos e financeiro da Eco Direito Ambiental',
}

/** Aplica o tema salvo antes da primeira pintura (sem piscar o claro). Guia: preventing-flash-before-hydration. */
const TEMA_SALVO = `(function(){try{var t=localStorage.getItem("tema");if(t)document.documentElement.setAttribute("data-theme",t)}catch(e){}})()`

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR" data-theme="light" className={`${atkinson.variable} antialiased`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: TEMA_SALVO }} />
      </head>
      <body className="min-h-screen font-sans">{children}</body>
    </html>
  )
}

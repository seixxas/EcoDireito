import type { Metadata } from 'next'
import { Instrument_Sans } from 'next/font/google'
import type { ReactNode } from 'react'
import { URL_DOS_ICONES } from '@/components/ui/icone'
import './globals.css'

/** Fonte do desenho 3a (10/11). */
const instrument = Instrument_Sans({ variable: '--font-instrument', subsets: ['latin', 'latin-ext'], weight: ['400', '500', '600', '700'] })

export const metadata: Metadata = {
  title: { default: 'Eco Direito', template: '%s · Eco Direito' },
  description: 'Prazos e financeiro da Eco Direito Ambiental',
}

/** Aplica o tema salvo antes da primeira pintura (sem piscar o claro). Guia: preventing-flash-before-hydration. */
const TEMA_SALVO = `(function(){try{var t=localStorage.getItem("tema");if(t)document.documentElement.setAttribute("data-theme",t)}catch(e){}})()`

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR" data-theme="light" className={`${instrument.variable} antialiased`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: TEMA_SALVO }} />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="stylesheet" href={URL_DOS_ICONES} />
      </head>
      <body className="min-h-screen font-sans">{children}</body>
    </html>
  )
}

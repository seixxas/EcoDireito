import type { Metadata } from 'next'
import { Bricolage_Grotesque, IBM_Plex_Sans } from 'next/font/google'
import type { ReactNode } from 'react'
import './globals.css'

const plex = IBM_Plex_Sans({ variable: '--font-plex', subsets: ['latin'], weight: ['400', '500', '600', '700'] })
const bricolage = Bricolage_Grotesque({ variable: '--font-bricolage', subsets: ['latin'] })

export const metadata: Metadata = {
  title: { default: 'Eco Direito', template: '%s · Eco Direito' },
  description: 'Prazos e financeiro da Eco Direito Ambiental',
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR" className={`${plex.variable} ${bricolage.variable} antialiased`}>
      <body className="min-h-screen font-sans">{children}</body>
    </html>
  )
}

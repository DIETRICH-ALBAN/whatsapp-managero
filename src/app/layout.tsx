import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { SmoothScrollProvider } from '@/components/providers/SmoothScrollProvider'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })

export const metadata: Metadata = {
  title: 'VibeVendor - Assistant IA Commerce WhatsApp',
  description: 'Plateforme de gestion commerciale intelligente pour PME',
  keywords: ['WhatsApp', 'Business', 'CRM', 'Cameroun', 'PME'],
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased`}>
        <SmoothScrollProvider>
          {children}
        </SmoothScrollProvider>
      </body>
    </html>
  )
}

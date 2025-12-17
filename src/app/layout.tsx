import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { SmoothScrollProvider } from '@/components/providers/SmoothScrollProvider'
import { Toaster } from '@/components/ui/sonner'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })

export const metadata: Metadata = {
  title: 'VibeVendor - Assistant IA Commerce WhatsApp',
  description: 'Plateforme de gestion commerciale intelligente pour PME',
  keywords: ['WhatsApp', 'Business', 'CRM', 'Cameroun', 'PME'],
}

import { ThemeProvider } from "@/components/theme-provider"

// ... imports

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <SmoothScrollProvider>
            {children}
            <Toaster />
          </SmoothScrollProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}

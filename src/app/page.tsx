'use client'

import { Navbar } from '@/components/landing/Navbar'
import { Hero } from '@/components/landing/Hero'
import { Features } from '@/components/landing/Features'
import { ProblemSolution } from '@/components/landing/ProblemSolution'
import { HowItWorks } from '@/components/landing/HowItWorks'
import { Testimonials } from '@/components/landing/Testimonials'
import { Pricing } from '@/components/landing/Pricing'
import { FAQ } from '@/components/landing/FAQ'
import { CTA } from '@/components/landing/CTA'
import { Footer } from '@/components/landing/Footer'
import { SmoothScrollProvider } from '@/components/providers/SmoothScrollProvider'

export default function Home() {
  return (
    <SmoothScrollProvider>
      <main className="bg-background-deep min-h-screen selection:bg-indigo-500/30 selection:text-indigo-200">
        <Navbar />
        <Hero />
        <ProblemSolution />
        <Features />
        <HowItWorks />
        <Testimonials />
        <Pricing />
        <FAQ />
        <CTA />
        <Footer />
      </main>
    </SmoothScrollProvider>
  )
}

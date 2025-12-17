'use client'

import React from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Logo } from '@/components/ui/logo'

export function Navbar() {
    const handleScroll = (e: React.MouseEvent<HTMLAnchorElement, MouseEvent>, id: string) => {
        e.preventDefault()
        const element = document.getElementById(id)
        if (element) {
            const offset = 80 // Navbar height + padding
            const bodyRect = document.body.getBoundingClientRect().top
            const elementRect = element.getBoundingClientRect().top
            const elementPosition = elementRect - bodyRect
            const offsetPosition = elementPosition - offset

            window.scrollTo({
                top: offsetPosition,
                behavior: 'smooth'
            })
        }
    }

    return (
        <motion.nav
            initial={{ y: -100 }}
            animate={{ y: 0 }}
            transition={{ duration: 0.5 }}
            className="fixed top-0 w-full z-50 border-b border-white/5 bg-background-deep/80 backdrop-blur-md"
        >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    {/* Logo */}
                    <div className="cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
                        <Logo size="md" href="" />
                    </div>

                    {/* Desktop Links */}
                    <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-300">
                        <a href="#features" onClick={(e) => handleScroll(e, 'features')} className="hover:text-white transition-colors cursor-pointer">Fonctionnalités</a>
                        <a href="#demo" onClick={(e) => handleScroll(e, 'demo')} className="hover:text-white transition-colors cursor-pointer">Démo</a>
                        <a href="#pricing" onClick={(e) => handleScroll(e, 'pricing')} className="hover:text-white transition-colors cursor-pointer">Tarifs</a>
                    </div>

                    {/* CTA */}
                    <div className="flex items-center gap-4">
                        <Link href="/login" className="text-sm font-medium text-slate-300 hover:text-white hidden sm:block">
                            Connexion
                        </Link>
                        <Link href="/register">
                            <Button className="bg-white text-black hover:bg-slate-200 border-none rounded-full px-6 font-semibold">
                                Essayer Gratuitement
                            </Button>
                        </Link>
                    </div>
                </div>
            </div>
        </motion.nav>
    )
}

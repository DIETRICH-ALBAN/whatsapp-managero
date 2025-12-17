'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Logo } from '@/components/ui/logo'

export function Navbar() {
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
                    <Logo size="md" />

                    {/* Desktop Links */}
                    <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-300">
                        <Link href="#features" className="hover:text-white transition-colors">Fonctionnalités</Link>
                        <Link href="#demo" className="hover:text-white transition-colors">Démo</Link>
                        <Link href="#pricing" className="hover:text-white transition-colors">Tarifs</Link>
                    </div>

                    {/* CTA */}
                    <div className="flex items-center gap-4">
                        <Link href="/login" className="text-sm font-medium text-slate-300 hover:text-white hidden sm:block">
                            Connexion
                        </Link>
                        <Button className="bg-white text-black hover:bg-slate-200 border-none rounded-full px-6 font-semibold">
                            Essayer Gratuitement
                        </Button>
                    </div>
                </div>
            </div>
        </motion.nav>
    )
}

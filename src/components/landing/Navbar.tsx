'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Logo } from '@/components/ui/logo'
import { Menu, X } from 'lucide-react'

export function Navbar() {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

    const handleScroll = (e: React.MouseEvent<HTMLAnchorElement, MouseEvent>, id: string) => {
        e.preventDefault()
        setMobileMenuOpen(false)
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

    const navLinks = [
        { label: 'Fonctionnalités', id: 'features' },
        { label: 'Démo', id: 'demo' },
        { label: 'Tarifs', id: 'pricing' },
    ]

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
                    <div className="cursor-pointer shrink-0" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
                        <Logo size="md" href="" />
                    </div>

                    {/* Desktop Links */}
                    <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-300">
                        {navLinks.map((link) => (
                            <a
                                key={link.id}
                                href={`#${link.id}`}
                                onClick={(e) => handleScroll(e, link.id)}
                                className="hover:text-white transition-colors cursor-pointer"
                            >
                                {link.label}
                            </a>
                        ))}
                    </div>

                    {/* Desktop CTA */}
                    <div className="hidden sm:flex items-center gap-4">
                        <Link href="/login" className="text-sm font-medium text-slate-300 hover:text-white">
                            Connexion
                        </Link>
                        <Link href="/register">
                            <Button className="bg-white text-black hover:bg-slate-200 border-none rounded-full px-6 font-semibold">
                                Essayer Gratuitement
                            </Button>
                        </Link>
                    </div>

                    {/* Mobile Menu Button */}
                    <button
                        className="sm:hidden p-2 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                        aria-label="Toggle menu"
                    >
                        {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                    </button>
                </div>
            </div>

            {/* Mobile Menu */}
            <AnimatePresence>
                {mobileMenuOpen && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3 }}
                        className="sm:hidden bg-background-deep/95 backdrop-blur-lg border-t border-white/5"
                    >
                        <div className="px-4 py-6 space-y-4">
                            {navLinks.map((link) => (
                                <a
                                    key={link.id}
                                    href={`#${link.id}`}
                                    onClick={(e) => handleScroll(e, link.id)}
                                    className="block py-3 px-4 text-lg font-medium text-slate-300 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                                >
                                    {link.label}
                                </a>
                            ))}
                            <div className="pt-4 border-t border-white/10 space-y-3">
                                <Link
                                    href="/login"
                                    className="block py-3 px-4 text-lg font-medium text-slate-300 hover:text-white hover:bg-white/5 rounded-lg transition-colors text-center"
                                    onClick={() => setMobileMenuOpen(false)}
                                >
                                    Connexion
                                </Link>
                                <Link href="/register" onClick={() => setMobileMenuOpen(false)}>
                                    <Button className="w-full bg-white text-black hover:bg-slate-200 border-none rounded-full py-3 font-semibold">
                                        Essayer Gratuitement
                                    </Button>
                                </Link>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.nav>
    )
}

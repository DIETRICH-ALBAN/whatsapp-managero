'use client'

import { motion } from 'framer-motion'
import Script from 'next/script'
// import dynamic from 'next/dynamic'

// const Spline = dynamic(() => import('@splinetool/react-spline'), {
//     ssr: false,
//     loading: () => (
//         <div className="w-full h-full flex items-center justify-center">
//             <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
//         </div>
//     ),
// })
import { Button } from '@/components/ui/button'
import { ArrowRight, Sparkles, Trophy } from 'lucide-react'

export function Hero() {
    return (
        <section className="relative min-h-[110vh] flex items-center pt-20 overflow-hidden bg-background-deep">
            {/* Background Grids & Orbs */}
            <div className="absolute inset-0 bg-grid-white opacity-[0.03] z-0" />
            <div className="absolute top-20 right-0 w-[500px] h-[500px] bg-indigo-600/20 rounded-full blur-[120px] z-0" />
            <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-[100px] z-0" />

            {/* Effet Demi-Anneau / Horizon Lumineux (Corrigé & Intensifié) */}
            <div className="absolute bottom-0 left-0 right-0 h-[500px] z-0 overflow-hidden pointer-events-none">
                {/* Lueur blanche principale (La courbe) */}
                <div className="absolute -bottom-[60%] left-1/2 -translate-x-1/2 w-[200%] h-[100%] bg-white rounded-[100%] blur-[100px] opacity-20" />

                {/* Lueur secondaire indigo pour la profondeur */}
                <div className="absolute -bottom-[50%] left-1/2 -translate-x-1/2 w-[150%] h-[80%] bg-indigo-500 rounded-[100%] blur-[120px] opacity-30 mix-blend-screen" />

                {/* Ligne d'horizon nette (facultatif, ajoute du détail) */}
                <div className="absolute bottom-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-white/50 to-transparent opacity-50" />
            </div>

            <div className="container relative z-10 mx-auto px-4 grid lg:grid-cols-2 gap-12 items-center">

                {/* Text Content */}
                <motion.div
                    initial={{ opacity: 0, x: -50 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className="max-w-2xl"
                >
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-indigo-500/30 bg-indigo-500/10 text-indigo-300 text-xs font-medium mb-6">
                        <Trophy className="w-3 h-3 text-yellow-500" />
                        <span>Élu Meilleur Outil PME 2025</span>
                    </div>

                    <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-white mb-6 leading-tight">
                        Votre Commerce <br />
                        <span className="text-gradient">Autopilote sur WhatsApp</span>
                    </h1>

                    <p className="text-lg text-slate-400 mb-8 max-w-lg leading-relaxed">
                        Ne perdez plus jamais une vente. Notre IA répond à vos clients Camerounais,
                        prend les commandes et gère votre stock, même quand vous dormez.
                    </p>

                    <div className="flex flex-col sm:flex-row gap-4">
                        <Button size="lg" className="rounded-full h-14 px-8 text-base bg-indigo-600 hover:bg-indigo-700 shadow-[0_0_30px_rgba(79,70,229,0.4)]">
                            Démarrer Gratuitement <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                        <Button size="lg" variant="outline" className="rounded-full h-14 px-8 text-base border-slate-700 hover:bg-slate-800 text-slate-300">
                            Voir la Démo Live
                        </Button>
                    </div>

                    <div className="mt-10 flex items-center gap-6 text-sm text-slate-500 font-medium">
                        <div className="flex -space-x-3">
                            {[1, 2, 3, 4].map(i => (
                                <div key={i} className={`w-8 h-8 rounded-full border-2 border-background-deep bg-slate-800 flex items-center justify-center text-xs text-white`}>
                                    {i === 4 ? '+' : ''}
                                </div>
                            ))}
                        </div>
                        <p>Déjà utilisé par <span className="text-white">500+ commerçants</span> au Cameroun</p>
                    </div>
                </motion.div>

                {/* 3D Content (Right Side) */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 1, delay: 0.2 }}
                    className="relative h-[600px] hidden lg:block rounded-[2.5rem] overflow-hidden border border-white/10 bg-white/5 shadow-2xl backdrop-blur-sm"
                >
                    {/* Fallback visuel élégant si Spline charge lentement */}
                    <div className="absolute inset-0 bg-transparent flex items-center justify-center -z-10">
                        <div className="w-64 h-64 bg-indigo-500/10 rounded-full animate-pulse" />
                    </div>

                    {/* Scène Spline : Robot Nexbot (Web Component) */}
                    <div className="w-full h-full">
                        <Script
                            src="https://unpkg.com/@splinetool/viewer@1.12.21/build/spline-viewer.js"
                            type="module"
                        />
                        {/* @ts-ignore - Custom Web Component */}
                        <spline-viewer
                            url="https://prod.spline.design/fMmOnUyvRru0su5g/scene.splinecode"
                            style={{ width: '100%', height: '100%' }}
                        />
                    </div>
                </motion.div>
            </div>

            {/* Scroll Indicator */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1, y: [0, 10, 0] }}
                transition={{ delay: 2, duration: 2, repeat: Infinity }}
                className="absolute bottom-10 left-1/2 -translate-x-1/2 text-slate-500"
            >
                <div className="w-6 h-10 border-2 border-slate-700 rounded-full flex justify-center p-1">
                    <div className="w-1 h-3 bg-indigo-500 rounded-full" />
                </div>
            </motion.div>
        </section>
    )
}

'use client'

import { motion } from 'framer-motion'
import { X, Check, ArrowRight, Activity, Zap } from 'lucide-react'
import { Card } from '@/components/ui/card'

export function ProblemSolution() {
    return (
        <section className="py-32 relative overflow-hidden bg-background-deep">
            {/* Background Ambience */}
            <div className="absolute top-1/2 left-0 w-full h-[500px] bg-gradient-to-r from-red-500/5 via-transparent to-indigo-500/5 blur-[120px] -translate-y-1/2 pointer-events-none" />

            <div className="container mx-auto px-4 sm:px-6 relative z-10">

                {/* Header Section */}
                <div className="text-center max-w-3xl mx-auto mb-12 sm:mb-16 lg:mb-20">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                    >
                        <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold text-white mb-4 sm:mb-6 tracking-tight">
                            Passez du <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-orange-400 opacity-80">Chaos</span> à la <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400">Maîtrise</span>.
                        </h2>
                        <p className="text-base sm:text-lg text-slate-400/80 leading-relaxed px-4 sm:px-0">
                            La gestion manuelle freine votre croissance. Adoptez l'infrastructure qui propulse les leaders du marché.
                        </p>
                    </motion.div>
                </div>

                <div className="grid lg:grid-cols-2 gap-8 items-stretch max-w-6xl mx-auto">

                    {/* CARD 1: THE OLD WAY (Dark, desaturated, "The Past") */}
                    <motion.div
                        initial={{ opacity: 0, x: -30 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        className="group relative"
                    >
                        <div className="absolute inset-0 bg-gradient-to-b from-red-500/5 to-transparent rounded-3xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-700" />

                        <Card className="h-full bg-[#0a0a0a] border-white/5 p-8 md:p-12 rounded-3xl relative overflow-hidden">
                            {/* Noise texture overlay */}
                            <div className="absolute inset-0 opacity-[0.03] bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />

                            <div className="relative z-10">
                                <div className="flex items-center gap-3 mb-8 opacity-60">
                                    <div className="p-2 rounded-lg bg-red-500/10 border border-red-500/20">
                                        <Activity className="w-5 h-5 text-red-400" />
                                    </div>
                                    <span className="text-red-400 font-mono text-sm uppercase tracking-widest">Méthode Traditionnelle</span>
                                </div>

                                <ul className="space-y-6">
                                    {[
                                        "Perte de clients la nuit (inactivité)",
                                        "Gestion de stock sur cahier/Excel",
                                        "Oubli de relance des prospects",
                                        "Surcharge mentale quotidienne"
                                    ].map((item, i) => (
                                        <li key={i} className="flex items-start gap-4 text-slate-500 group-hover:text-slate-400 transition-colors">
                                            <X className="w-6 h-6 text-red-900/50 mt-0.5 shrink-0" />
                                            <span className="text-lg">{item}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </Card>
                    </motion.div>


                    {/* CARD 2: THE NEW WAY (Glowing, Premium, "The Future") */}
                    <motion.div
                        initial={{ opacity: 0, x: 30 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        className="relative"
                    >
                        {/* Glowing border effect */}
                        <div className="absolute -inset-[1px] bg-gradient-to-b from-indigo-500 to-purple-600 rounded-3xl blur-sm opacity-50" />
                        <div className="absolute -inset-[1px] bg-gradient-to-b from-indigo-500 to-purple-600 rounded-3xl opacity-20" />

                        <Card className="h-full bg-[#0f0f16] border-transparent p-8 md:p-12 rounded-3xl relative overflow-hidden">

                            {/* Ambient Glow */}
                            <div className="absolute top-0 right-0 w-full h-full bg-gradient-to-bl from-indigo-500/10 via-transparent to-transparent pointer-events-none" />

                            <div className="relative z-10">
                                <div className="flex items-center justify-between mb-8">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 rounded-lg bg-indigo-500 border border-indigo-400 shadow-[0_0_15px_rgba(99,102,241,0.5)]">
                                            <Zap className="w-5 h-5 text-white" />
                                        </div>
                                        <span className="text-indigo-400 font-mono text-sm uppercase tracking-widest font-bold">VibeVendor</span>
                                    </div>
                                    <div className="px-3 py-1 rounded-full bg-green-500/10 border border-green-500/20 text-green-400 text-xs font-bold uppercase tracking-wider">
                                        Recommandé
                                    </div>
                                </div>

                                <ul className="space-y-6">
                                    {[
                                        "IA Commerciale active 24h/24",
                                        "Synchronisation Stock Temps Réel",
                                        "Mise en relation automatique",
                                        "Pilotage depuis un Dashboard Zen"
                                    ].map((item, i) => (
                                        <li key={i} className="flex items-start gap-4">
                                            <div className="mt-0.5 p-0.5 rounded-full bg-indigo-500/20 text-indigo-400">
                                                <Check className="w-4 h-4" />
                                            </div>
                                            <span className="text-lg text-white font-medium">{item}</span>
                                        </li>
                                    ))}
                                </ul>

                                {/* Visual Bonus */}
                                <div className="mt-10 pt-8 border-t border-white/5">
                                    <div className="flex items-center gap-4 text-slate-400 text-sm">
                                        <span>Résultat estimé :</span>
                                        <div className="flex items-center gap-2 text-green-400 font-bold">
                                            <ArrowRight className="w-4 h-4" />
                                            +35% de ventes dès le 1er mois
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </Card>
                    </motion.div>

                </div>
            </div>
        </section>
    )
}

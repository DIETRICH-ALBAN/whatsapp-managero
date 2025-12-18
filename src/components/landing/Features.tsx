'use client'

import { motion } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
import { BrainCircuit, MessageSquareText, ShoppingBag, BarChart3, Clock, Lock } from 'lucide-react'

const features = [
    {
        icon: MessageSquareText,
        title: "Centralisation WhatsApp",
        desc: "Gérez tous vos messages clients depuis une seule interface web optimisée pour PC et mobile.",
        color: "text-green-400",
        delay: 0
    },
    {
        icon: BrainCircuit,
        title: "IA Camerounaise",
        desc: "Notre IA comprend le 'Francanglais' et répond naturellement pour prendre les commandes.",
        color: "text-indigo-400",
        delay: 0.1
    },
    {
        icon: ShoppingBag,
        title: "Gestion de Stock",
        desc: "Mise à jour automatique de votre inventaire à chaque vente confirmée via WhatsApp.",
        color: "text-pink-400",
        delay: 0.2
    },
    {
        icon: BarChart3,
        title: "Analytiques Ventes",
        desc: "Suivez votre chiffre d'affaires en FCFA en temps réel et identifiez vos meilleurs produits.",
        color: "text-blue-400",
        delay: 0.3
    },
    {
        icon: Clock,
        title: "Réponses 24/7",
        desc: "Ne laissez plus aucun client attendre. Le bot répond instantanément, même la nuit.",
        color: "text-amber-400",
        delay: 0.4
    },
    {
        icon: Lock,
        title: "Sécurité & Backup",
        desc: "Vos données clients et historiques de commandes sont chiffrés et sauvegardés.",
        color: "text-emerald-400",
        delay: 0.5
    }
]

export function Features() {
    return (
        <section id="features" className="py-16 sm:py-20 lg:py-24 bg-background-deep relative overflow-hidden">
            <div className="container mx-auto px-4 sm:px-6 z-10 relative">

                <div className="text-center max-w-3xl mx-auto mb-10 sm:mb-12 lg:mb-16">
                    <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4 sm:mb-6">
                        Tout ce dont vous avez besoin pour <br className="hidden sm:block" />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400">
                            Vendre Mieux
                        </span>
                    </h2>
                    <p className="text-slate-400 text-base sm:text-lg px-4 sm:px-0">
                        Une suite d'outils puissants conçus spécifiquement pour le marché africain.
                        Simple, rapide, efficace.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                    {features.map((f, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, margin: "-100px" }}
                            transition={{ delay: f.delay }}
                        >
                            <div
                                className="group relative h-full p-1 rounded-2xl bg-gradient-to-b from-white/10 to-transparent hover:from-indigo-500/50 hover:to-purple-500/50 transition-all duration-500"
                            >
                                <div className="absolute inset-0 bg-background-deep rounded-2xl m-[1px] z-0" />
                                <div className="relative z-10 p-5 sm:p-8 h-full flex flex-col items-start bg-white/5 backdrop-blur-sm rounded-xl hover:bg-white/10 transition-colors">

                                    <div className={`p-3 rounded-lg bg-white/5 mb-6 ${f.color} group-hover:scale-110 transition-transform duration-300`}>
                                        <f.icon className="w-8 h-8" />
                                    </div>

                                    <h3 className="text-xl font-bold text-white mb-3 group-hover:text-indigo-300 transition-colors">
                                        {f.title}
                                    </h3>

                                    <p className="text-slate-400 leading-relaxed">
                                        {f.desc}
                                    </p>

                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>

            </div>
        </section>
    )
}

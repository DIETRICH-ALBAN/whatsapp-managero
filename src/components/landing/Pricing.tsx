'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Check, X, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch' // Assurez-vous d'avoir ce composant ou je le créerai

export function Pricing() {
    const [isAnnual, setIsAnnual] = useState(false)

    const plans = [
        {
            name: "Démarrage",
            price: 0,
            period: "semaine",
            description: "Pour les testeurs initiaux",
            color: "from-blue-400 to-cyan-300",
            glow: "bg-blue-500/20",
            btnVariant: "outline",
            features: [
                { text: "Connexion WhatsApp (50 msgs/jour)", included: true },
                { text: "1 Agent IA (5 Templates)", included: true },
                { text: "Dashboard Basique (Vue simple)", included: true },
                { text: "Alertes Email seulement", included: true },
                { text: "1 Utilisateur", included: true },
                { text: "Gestion de Commandes", included: false },
                { text: "Analytiques", included: false },
            ]
        },
        {
            name: "Basique",
            price: isAnnual ? 4000 : 5000,
            period: "mois",
            description: "Pour commerçants ambulants",
            isPopular: true,
            color: "from-purple-400 to-pink-400", // Style "Creator Plan" de l'image
            glow: "bg-purple-500/20",
            btnVariant: "default",
            features: [
                { text: "Messages Illimités (1 Numéro)", included: true },
                { text: "IA Custom (10 Templates + Pidgin)", included: true },
                { text: "Tracking Commandes (Reçu/Livré)", included: true },
                { text: "Alertes Email + SMS", included: true },
                { text: "3 Utilisateurs", included: true },
                { text: "Stock Simple (Supabase)", included: true },
                { text: "Rapports Hebdomadaires", included: true },
            ]
        },
        {
            name: "Pro",
            price: isAnnual ? 12000 : 15000,
            period: "mois",
            description: "Pour les PME en croissance",
            color: "from-emerald-400 to-teal-400", // Style "Enterprise"
            glow: "bg-emerald-500/20",
            btnVariant: "outline",
            features: [
                { text: "Multi-numéros (Jusqu'à 5)", included: true },
                { text: "IA Avancée (Contexte Long)", included: true },
                { text: "Dashboard Avancé + Exports", included: true },
                { text: "Push Notifs & Mobile Money", included: true },
                { text: "Utilisateurs Illimités", included: true },
                { text: "Inventaire Auto + Prévisions IA", included: true },
                { text: "Intégrations (Jumia/Glovo, API)", included: true },
            ]
        }
    ]

    return (
        <section id="pricing" className="py-32 bg-background-deep relative overflow-hidden">
            <div className="container mx-auto px-4 z-10 relative">

                {/* Header Section */}
                <div className="text-center max-w-3xl mx-auto mb-16">
                    <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">
                        Choisissez le plan parfait
                    </h2>
                    <p className="text-slate-400 mb-8">
                        Des solutions adaptées à chaque étape de votre croissance, du testeur à la PME établie.
                    </p>

                    {/* Toggle Mensuel/Annuel */}
                    <div className="flex items-center justify-center gap-4">
                        <span className={`text-sm ${!isAnnual ? 'text-white font-medium' : 'text-slate-500'}`}>Mensuel</span>
                        <div
                            onClick={() => setIsAnnual(!isAnnual)}
                            className="w-14 h-7 bg-slate-800 rounded-full p-1 cursor-pointer relative transition-colors hover:bg-slate-700 border border-slate-700"
                        >
                            <motion.div
                                layout
                                className="w-5 h-5 bg-indigo-500 rounded-full shadow-md"
                                animate={{ x: isAnnual ? 28 : 0 }}
                            />
                        </div>
                        <span className={`text-sm ${isAnnual ? 'text-white font-medium' : 'text-slate-500'}`}>
                            Annuel <span className="text-green-400 text-xs font-bold ml-1">-20%</span>
                        </span>
                    </div>
                </div>

                {/* Pricing Grid */}
                <div className="grid lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
                    {plans.map((plan, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: i * 0.1 }}
                            className={`relative flex flex-col h-full bg-[#0F0F13] rounded-[2rem] border overflow-hidden transition-all duration-300 ${plan.isPopular ? 'border-purple-500/50 shadow-[0_0_40px_rgba(168,85,247,0.15)] scale-105 z-10' : 'border-white/5 hover:border-white/10'
                                }`}
                        >
                            {/* Fluid Header Effect */}
                            <div className="absolute top-0 left-0 w-full h-48 opacity-30 pointer-events-none">
                                <div className={`absolute -top-24 -left-12 w-64 h-64 bg-gradient-to-br ${plan.color} rounded-full blur-[80px]`} />
                                <div className={`absolute -top-12 right-0 w-48 h-48 bg-gradient-to-bl ${plan.color} rounded-full blur-[60px] opacity-60`} />
                            </div>

                            <div className="relative z-10 p-8 flex flex-col h-full">
                                {/* Plan Name & Desc */}
                                <div className="mb-6">
                                    {plan.isPopular && (
                                        <span className="absolute top-8 right-8 px-3 py-1 bg-white text-black text-xs font-bold rounded-full">
                                            Populaire
                                        </span>
                                    )}
                                    <h3 className="text-xl font-medium text-white mb-2">{plan.name}</h3>
                                    <p className="text-sm text-slate-400 h-10">{plan.description}</p>
                                </div>

                                {/* Price */}
                                <div className="mb-8">
                                    <div className="flex items-baseline gap-1">
                                        <span className="text-4xl font-bold text-white">
                                            {plan.price === 0 ? 'Gratuit' : plan.price.toLocaleString()}
                                        </span>
                                        {plan.price > 0 && <span className="text-lg text-slate-500">FCFA</span>}
                                    </div>
                                    <span className="text-sm text-slate-500">/{plan.period}</span>
                                </div>

                                {/* Button */}
                                <Button
                                    className={`w-full h-12 rounded-xl mb-10 font-medium transition-all ${plan.isPopular
                                            ? 'bg-gradient-to-r from-purple-600 to-pink-600 hover:opacity-90 border-0 text-white shadow-lg'
                                            : 'bg-white/5 hover:bg-white/10 text-white border-0'
                                        }`}
                                >
                                    {plan.price === 0 ? 'Commencer' : 'Choisir ce plan'}
                                </Button>

                                {/* Features List */}
                                <div className="flex-1 space-y-4">
                                    <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">Fonctionnalités</p>
                                    {plan.features.map((feat, j) => (
                                        <div key={j} className="flex items-start gap-3 text-sm">
                                            <div className={`mt-0.5 min-w-[18px] h-[18px] rounded-full flex items-center justify-center ${feat.included
                                                    ? `bg-gradient-to-br ${plan.color} text-black`
                                                    : 'bg-slate-800 text-slate-500'
                                                }`}>
                                                {feat.included ? <Check className="w-3 h-3 text-white" /> : <X className="w-3 h-3" />}
                                            </div>
                                            <span className={feat.included ? 'text-slate-300' : 'text-slate-600 line-through decoration-slate-700'}>
                                                {feat.text}
                                            </span>
                                        </div>
                                    ))}
                                </div>

                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* Trust Badge */}
                <div className="mt-16 text-center">
                    <p className="text-slate-500 text-sm flex items-center justify-center gap-2">
                        <Sparkles className="w-4 h-4 text-indigo-500" />
                        Pas de carte bancaire requise pour l'essai gratuit.
                    </p>
                </div>

            </div>
        </section>
    )
}

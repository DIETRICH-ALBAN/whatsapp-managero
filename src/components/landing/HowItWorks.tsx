'use client'

import { motion } from 'framer-motion'
import { Check, Sparkles, Send, Phone, MessageSquare } from 'lucide-react'

const features = [
    {
        title: "Détection d'Intention",
        desc: "L'IA comprend si le client veut acheter, connaître un prix ou suivre une commande, même en 'Francanglais'."
    },
    {
        title: "Réponses Personnalisées",
        desc: "Elle adopte le ton de votre boutique (poli, convivial, ou professionnel) et suggère des produits complémentaires."
    },
    {
        title: "Disponible 24h/7j",
        desc: "Pendant que vous dormez, l'IA continue de vendre et de noter les commandes dans votre dashboard."
    }
]

export function HowItWorks() {
    return (
        <section className="py-16 sm:py-24 lg:py-32 bg-background-deep relative overflow-hidden">
            {/* Background Glow */}
            <div className="absolute top-1/2 right-0 w-[400px] sm:w-[600px] lg:w-[800px] h-[400px] sm:h-[600px] lg:h-[800px] bg-indigo-600/10 rounded-full blur-[80px] sm:blur-[120px] -translate-y-1/2 z-0 pointer-events-none" />

            <div className="container mx-auto px-4 sm:px-6 relative z-10">
                <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">

                    {/* Left Content: Text & Features */}
                    <motion.div
                        initial={{ opacity: 0, x: -30 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        className="space-y-6 sm:space-y-8 text-center lg:text-left"
                    >
                        <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-2 rounded-full bg-white/5 border border-white/10 text-indigo-300 text-xs sm:text-sm font-medium">
                            <Sparkles className="w-4 h-4" />
                            <span>Intelligence Artificielle</span>
                        </div>

                        <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white leading-tight">
                            Une IA qui <span className="text-gradient">comprend</span> vraiment vos clients
                        </h2>

                        <p className="text-base sm:text-lg text-slate-400 leading-relaxed max-w-lg mx-auto lg:mx-0">
                            Notre technologie analyse chaque message WhatsApp, détecte les intentions d'achat et répond de manière naturelle pour conclure la vente.
                        </p>

                        <div className="space-y-4 sm:space-y-6 pt-4 text-left">
                            {features.map((f, i) => (
                                <div key={i} className="flex gap-3 sm:gap-4">
                                    <div className="mt-1 w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-indigo-500 flex items-center justify-center shrink-0 shadow-lg shadow-indigo-500/30">
                                        <Check className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-white" strokeWidth={3} />
                                    </div>
                                    <div>
                                        <h4 className="text-white font-bold text-base sm:text-lg">{f.title}</h4>
                                        <p className="text-slate-500 leading-relaxed text-sm sm:text-base">{f.desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </motion.div>


                    {/* Right Content: The Interactive Mockup */}
                    <motion.div
                        initial={{ opacity: 0, x: 30 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        className="relative"
                    >
                        {/* Outline Glow Effect */}
                        <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-[2rem] blur opacity-30" />

                        <div className="relative bg-[#1a1a22] border border-white/10 rounded-[2rem] overflow-hidden shadow-2xl">
                            {/* Chat Header */}
                            <div className="bg-[#23232f] p-4 flex items-center justify-between border-b border-white/5">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-green-600 flex items-center justify-center text-white">
                                        <Phone className="w-5 h-5" fill="currentColor" />
                                    </div>
                                    <div>
                                        <div className="font-bold text-white text-sm">Votre Boutique</div>
                                        <div className="flex items-center gap-1.5">
                                            <span className="relative flex h-2 w-2">
                                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                                            </span>
                                            <span className="text-xs text-green-400 font-medium">En ligne - IA Active</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="p-2 rounded-full hover:bg-white/5 cursor-pointer text-slate-400">
                                    <MessageSquare className="w-5 h-5" />
                                </div>
                            </div>

                            {/* Chat Area */}
                            <div className="p-6 h-[400px] flex flex-col gap-6 bg-[url('https://camo.githubusercontent.com/c279d282f42a201c775073004bbad6d96e594e9f783267dd38153381a1a364be/68747470733a2f2f7765622e77686174736170702e636f6d2f696d672f62672d636861742d74696c652d6461726b5f61346265353132653731393562366237333362393636666163643431393565612e706e67')] bg-repeat bg-[length:400px]">

                                {/* Message Client */}
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: 0.2 }}
                                    className="self-start max-w-[85%]"
                                >
                                    <div className="bg-[#2a2a35] text-slate-200 p-3.5 rounded-2xl rounded-tl-none shadow-md border border-white/5">
                                        <p className="text-sm">Bonsoir, c'est combien le iPhone 13 ? Vous livrez à Yaoundé ?</p>
                                        <span className="text-[10px] text-slate-500 mt-1 block text-right">19:42</span>
                                    </div>
                                </motion.div>

                                {/* Message IA (Animated) */}
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    whileInView={{ opacity: 1, scale: 1 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: 1.2, type: "spring" }} // Delay pour simuler la réflexion
                                    className="self-end max-w-[90%]"
                                >
                                    <div className="bg-gradient-to-br from-indigo-600 to-violet-600 text-white p-4 rounded-2xl rounded-tr-none shadow-lg relative overflow-hidden">
                                        {/* Shine effect */}
                                        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-transparent via-white/10 to-transparent skew-x-12 opacity-50" />

                                        <div className="relative z-10">
                                            <p className="text-sm mb-2">Bonsoir ! 👋 L'iPhone 13 est en promo à <span className="font-bold text-yellow-300">350.000 FCFA</span>.</p>
                                            <p className="text-sm">Oui, nous livrons à Yaoundé pour 2000 FCFA (24h). 🚚</p>
                                            <p className="text-sm font-semibold mt-2 text-indigo-100">Voulez-vous que je valide la commande ?</p>
                                        </div>
                                        <div className="flex items-center justify-end gap-1 mt-1">
                                            <span className="text-[10px] text-indigo-200/80">19:42</span>
                                            <Check className="w-3 h-3 text-indigo-200" />
                                        </div>
                                    </div>
                                    <div className="text-[10px] text-slate-500 text-right mt-1 mr-1 flex items-center justify-end gap-1">
                                        <Sparkles className="w-3 h-3 text-indigo-500" />
                                        Répondu par l'IA
                                    </div>
                                </motion.div>
                            </div>

                            {/* Fake Input */}
                            <div className="p-3 bg-[#23232f] flex gap-2 items-center border-t border-white/5">
                                <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-slate-400">
                                    <span className="text-lg">+</span>
                                </div>
                                <div className="flex-1 bg-[#1a1a22] h-10 rounded-full px-4 flex items-center text-sm text-slate-500 border border-white/5">
                                    Je veux commander...
                                </div>
                                <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-600/20">
                                    <Send className="w-4 h-4 ml-0.5" />
                                </div>
                            </div>

                        </div>
                    </motion.div>

                </div>
            </div>
        </section>
    )
}

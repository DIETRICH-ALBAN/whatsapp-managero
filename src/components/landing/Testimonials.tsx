'use client'

import { motion } from 'framer-motion'
import { Card } from '@/components/ui/card'
import { Star } from 'lucide-react'

const testimonials = [
    {
        name: "Jean-Pierre K.",
        role: "Vendeur d'Electroménager, Douala",
        text: "Depuis que j'utilise cet outil, je ne rate plus aucune vente la nuit. L'IA répond mieux que mon ancien stagiaire !",
        rating: 5
    },
    {
        name: "Aïcha B.",
        role: "Boutique de Mode, Yaoundé",
        text: "La gestion de stock automatique est un vrai soulagement. Je sais exactement ce qu'il me reste sans compter.",
        rating: 5
    },
    {
        name: "Marc E.",
        role: "Restaurateur - Livraison",
        text: "Interface super simple. J'ai connecté mon WhatsApp en 2 minutes. Le support client est au top.",
        rating: 4
    }
]

export function Testimonials() {
    return (
        <section className="py-24 bg-background-deep relative overflow-hidden">
            {/* Cercles déco background */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-purple-600/10 rounded-full blur-[100px]" />

            <div className="container mx-auto px-4">
                <h2 className="text-3xl md:text-5xl font-bold text-center text-white mb-16">
                    Ils nous font <span className="text-gradient">Confiance</span>
                </h2>

                <div className="grid md:grid-cols-3 gap-8">
                    {testimonials.map((t, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, scale: 0.9 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            transition={{ delay: i * 0.2 }}
                            whileHover={{ y: -10 }}
                        >
                            <Card className="h-full bg-white/5 border-white/10 backdrop-blur-sm p-8 hover:bg-white/10 transition-colors">
                                <div className="flex gap-1 mb-4">
                                    {[...Array(5)].map((_, starI) => (
                                        <Star
                                            key={starI}
                                            className={`w-5 h-5 ${starI < t.rating ? 'text-yellow-400 fill-yellow-400' : 'text-slate-600'}`}
                                        />
                                    ))}
                                </div>
                                <p className="text-slate-300 mb-6 italic">"{t.text}"</p>
                                <div>
                                    <h4 className="font-bold text-white">{t.name}</h4>
                                    <p className="text-sm text-indigo-400">{t.role}</p>
                                </div>
                            </Card>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    )
}

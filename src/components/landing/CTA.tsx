'use client'

import { motion } from 'framer-motion'
import { ArrowRight, MessageCircle, Phone } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function CTA() {
    return (
        <section className="py-24 relative overflow-hidden">
            {/* Background Gradient - Matching the reference image */}
            <div className="absolute inset-0 bg-gradient-to-br from-violet-700 via-indigo-700 to-purple-800 z-0" />

            {/* Texture Overlay */}
            <div className="absolute inset-0 opacity-10 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] mix-blend-overlay pointer-events-none" />

            {/* Glow Effects */}
            <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-purple-500/30 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-indigo-500/30 rounded-full blur-[120px] pointer-events-none" />

            <div className="container mx-auto px-4 relative z-10 text-center">

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="max-w-3xl mx-auto"
                >
                    <h2 className="text-4xl md:text-6xl font-bold text-white mb-6 leading-tight tracking-tight">
                        Prêt à automatiser <br />
                        votre commerce ?
                    </h2>

                    <p className="text-lg md:text-xl text-indigo-100 mb-10 leading-relaxed max-w-2xl mx-auto">
                        Rejoignez des centaines de commerçants camerounais qui gagnent du temps et augmentent leurs ventes avec notre assistant IA.
                    </p>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-10">
                        <Button
                            size="lg"
                            className="h-14 px-8 rounded-full bg-white text-indigo-700 hover:bg-indigo-50 hover:text-indigo-800 font-bold text-base shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all duration-300"
                        >
                            <Phone className="w-5 h-5 mr-2" fill="currentColor" />
                            Connecter WhatsApp
                        </Button>

                        <Button
                            size="lg"
                            variant="outline"
                            className="h-14 px-8 rounded-full border-white/20 bg-white/5 text-white hover:bg-white/10 hover:border-white/30 backdrop-blur-sm font-medium text-base transition-all"
                        >
                            <MessageCircle className="w-5 h-5 mr-2" />
                            Des questions ?
                        </Button>
                    </div>

                    <div className="inline-flex items-center gap-2 text-sm text-indigo-200 bg-white/5 py-2 px-4 rounded-full border border-white/10">
                        <span>🎁</span>
                        <span className="font-medium">100% Gratuit pendant le MVP • Pas de carte bancaire requise</span>
                    </div>
                </motion.div>

            </div>
        </section>
    )
}

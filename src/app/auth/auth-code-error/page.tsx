'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { AlertTriangle, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function AuthCodeErrorPage() {
    return (
        <div className="min-h-screen bg-background-deep flex items-center justify-center p-8">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center max-w-md"
            >
                <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-6">
                    <AlertTriangle className="w-8 h-8 text-red-400" />
                </div>

                <h1 className="text-2xl font-bold text-white mb-4">
                    Erreur d'authentification
                </h1>

                <p className="text-slate-400 mb-8">
                    Une erreur s'est produite lors de la connexion. Veuillez réessayer ou utiliser une autre méthode de connexion.
                </p>

                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Link href="/login">
                        <Button className="rounded-xl bg-indigo-600 hover:bg-indigo-700">
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Retour à la connexion
                        </Button>
                    </Link>
                    <Link href="/">
                        <Button variant="outline" className="rounded-xl border-slate-700 text-white">
                            Accueil
                        </Button>
                    </Link>
                </div>
            </motion.div>
        </div>
    )
}

'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
    Smartphone,
    QrCode,
    CheckCircle2,
    Loader2,
    RefreshCw,
    Unplug,
    Wifi,
    WifiOff
} from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

type ConnectionStatus = 'disconnected' | 'connecting' | 'connected'

interface WhatsAppState {
    status: ConnectionStatus
    qrCode?: string
    phoneNumber?: string
    message?: string
}

export default function WhatsAppPage() {
    const [state, setState] = useState<WhatsAppState>({ status: 'disconnected' })
    const [loading, setLoading] = useState(false)
    const [polling, setPolling] = useState(false)

    // Vérifier le statut au chargement
    useEffect(() => {
        checkStatus()
    }, [])

    // Polling pour mettre à jour le statut pendant la connexion
    useEffect(() => {
        let interval: NodeJS.Timeout

        if (state.status === 'connecting' || state.status === 'disconnected') {
            setPolling(true)
            interval = setInterval(checkStatus, 3000)
        } else {
            setPolling(false)
        }

        return () => {
            if (interval) clearInterval(interval)
        }
    }, [state.status])

    const checkStatus = async () => {
        try {
            const res = await fetch('/api/whatsapp/connect')
            const data = await res.json()

            if (data.status === 'connected' && state.status !== 'connected') {
                toast.success('WhatsApp connecté !', {
                    description: `Prêt à envoyer des messages.`
                })
            }

            setState(data)
        } catch (error) {
            console.error('Erreur statut:', error)
        }
    }

    const startConnection = async () => {
        setLoading(true)
        try {
            const res = await fetch('/api/whatsapp/connect', { method: 'POST' })
            const data = await res.json()

            if (data.error) {
                toast.error('Erreur', {
                    description: data.details || data.error,
                    duration: 5000
                })
                return
            }

            setState(data)
            if (data.qrCode) {
                toast.info('QR Code généré', { description: 'Scannez-le avec votre téléphone.' })
            }
        } catch (error) {
            toast.error('Erreur de communication avec le service')
        } finally {
            setLoading(false)
        }
    }

    const disconnect = async () => {
        if (!confirm('Voulez-vous vraiment déconnecter votre compte WhatsApp ?')) return

        setLoading(true)
        try {
            await fetch('/api/whatsapp/connect', { method: 'DELETE' })
            setState({ status: 'disconnected' })
            toast.success('Déconnecté avec succès')
        } catch (error) {
            toast.error('Erreur lors de la déconnexion')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="max-w-3xl mx-auto space-y-8 pb-12">
            {/* Header */}
            <div className="text-center md:text-left">
                <h1 className="text-3xl font-black text-foreground tracking-tight">Connexion WhatsApp</h1>
                <p className="text-muted-foreground mt-2 text-lg">
                    Liez votre compte pour activer l'automatisation IA.
                </p>
            </div>

            {/* Main Connection Card */}
            <Card className="relative overflow-hidden border-white/5 bg-[#0D0D12] shadow-2xl rounded-3xl p-6 md:p-10">
                {/* Background Decoration */}
                <div className="absolute -top-24 -right-24 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl" />
                <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl" />

                <div className="relative z-10">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-10 pb-6 border-b border-white/5">
                        <div className="flex items-center gap-4">
                            <div className={cn(
                                "p-4 rounded-2xl shadow-inner",
                                state.status === 'connected' ? 'bg-emerald-500/20 text-emerald-500' :
                                    state.status === 'connecting' ? 'bg-amber-500/20 text-amber-500' :
                                        'bg-white/5 text-slate-400'
                            )}>
                                {state.status === 'connected' ?
                                    <Wifi className="w-8 h-8" /> :
                                    state.status === 'connecting' ?
                                        <Loader2 className="w-8 h-8 animate-spin" /> :
                                        <WifiOff className="w-8 h-8" />
                                }
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-white">
                                    {state.status === 'connected' ? 'Statut : Opérationnel' :
                                        state.status === 'connecting' ? 'Initialisation...' :
                                            'Prêt à connecter'}
                                </h3>
                                {state.phoneNumber ? (
                                    <p className="text-indigo-400 font-mono text-sm mt-1">Numéro lié : +{state.phoneNumber}</p>
                                ) : (
                                    <p className="text-slate-400 text-sm mt-1">Aucun appareil lié actuellement</p>
                                )}
                            </div>
                        </div>

                        <Badge
                            className={cn(
                                "px-4 py-1.5 text-xs font-bold uppercase tracking-widest rounded-full border-0 shadow-lg",
                                state.status === 'connected' ? 'bg-emerald-500 text-white' :
                                    state.status === 'connecting' ? 'bg-amber-500 text-black' :
                                        'bg-white/10 text-white'
                            )}
                        >
                            {state.status === 'connected' ? 'En ligne' :
                                state.status === 'connecting' ? 'Scan Requis' :
                                    'Hors ligne'}
                        </Badge>
                    </div>

                    {/* QR Code / Success Display */}
                    <AnimatePresence mode="wait">
                        {state.status === 'connecting' && state.qrCode ? (
                            <motion.div
                                key="qr-display"
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className="flex flex-col items-center py-4"
                            >
                                <div className="relative group">
                                    <div className="absolute inset-0 bg-indigo-500/30 blur-3xl rounded-full scale-110 group-hover:scale-125 transition-transform duration-1000 animate-pulse" />
                                    <div className="relative bg-white p-5 rounded-3xl shadow-2xl border-4 border-indigo-500/20 translate-y-0 hover:-translate-y-2 transition-transform duration-500">
                                        <img
                                            src={state.qrCode}
                                            alt="QR Code WhatsApp"
                                            className="w-56 h-56 md:w-64 md:h-64 rounded-xl"
                                        />
                                        {polling && (
                                            <div className="absolute bottom-2 right-2 bg-black/60 backdrop-blur-md px-2 py-1 rounded-lg flex items-center gap-2">
                                                <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping" />
                                                <span className="text-[10px] text-white font-bold">SYMBOLS LIVE</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div className="mt-10 text-center max-w-sm">
                                    <h4 className="text-white font-bold text-lg">Scannez ce code</h4>
                                    <p className="text-slate-400 text-sm mt-2 leading-relaxed">
                                        Ouvrez WhatsApp sur votre téléphone, allez dans <span className="text-indigo-400 font-medium">Réglages</span> → <span className="text-indigo-400 font-medium">Appareils connectés</span> et scannez le code.
                                    </p>
                                </div>
                            </motion.div>
                        ) : state.status === 'connected' ? (
                            <motion.div
                                key="success-display"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="flex flex-col items-center py-10"
                            >
                                <div className="relative">
                                    <div className="absolute inset-0 bg-emerald-500/20 blur-3xl rounded-full scale-150" />
                                    <div className="relative w-24 h-24 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-6">
                                        <CheckCircle2 className="w-12 h-12 text-emerald-500" />
                                    </div>
                                </div>
                                <h4 className="text-2xl font-black text-white">Connexion établie !</h4>
                                <p className="text-slate-400 text-center mt-3 max-w-xs leading-relaxed">
                                    Votre numéro est maintenant lié au Smart CRM. L'IA gère vos messages entrant en temps réel.
                                </p>
                            </motion.div>
                        ) : (
                            <motion.div
                                key="idle-display"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="flex flex-col items-center py-12"
                            >
                                <div className="w-20 h-20 rounded-[2rem] bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mb-6 rotate-12">
                                    <QrCode className="w-10 h-10 text-indigo-400" />
                                </div>
                                <p className="text-slate-400 text-center max-w-xs">
                                    Générez un QR Code sécurisé pour synchroniser votre session.
                                </p>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Action Buttons */}
                    <div className="flex flex-col sm:flex-row justify-center gap-4 mt-8">
                        {state.status === 'disconnected' && (
                            <Button
                                onClick={startConnection}
                                disabled={loading}
                                className="h-14 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl px-10 font-bold transition-all shadow-xl shadow-indigo-600/20 group"
                            >
                                {loading ? (
                                    <Loader2 className="w-5 h-5 mr-3 animate-spin" />
                                ) : (
                                    <Smartphone className="w-5 h-5 mr-3 group-hover:scale-110 transition-transform" />
                                )}
                                Démarrer la connexion
                            </Button>
                        )}

                        {state.status === 'connecting' && (
                            <Button
                                onClick={startConnection}
                                variant="outline"
                                disabled={loading}
                                className="h-14 border-white/10 hover:bg-white/5 text-white rounded-2xl px-8 font-bold"
                            >
                                <RefreshCw className={cn("w-5 h-5 mr-3", loading && "animate-spin")} />
                                Régénérer le QR Code
                            </Button>
                        )}

                        {state.status === 'connected' && (
                            <Button
                                onClick={disconnect}
                                variant="outline"
                                disabled={loading}
                                className="h-14 border-red-500/30 text-red-400 hover:bg-red-500/10 rounded-2xl px-10 font-bold transition-all"
                            >
                                {loading ? (
                                    <Loader2 className="w-5 h-5 mr-3 animate-spin" />
                                ) : (
                                    <Unplug className="w-5 h-5 mr-3" />
                                )}
                                Interrompre la connexion
                            </Button>
                        )}
                    </div>
                </div>
            </Card>

            {/* Steps & Info */}
            <div className="grid md:grid-cols-2 gap-6">
                <Card className="p-8 border-white/5 bg-[#0D0D12] rounded-3xl">
                    <h3 className="text-lg font-bold text-white mb-6">Instructions de sécurité</h3>
                    <div className="space-y-4 text-sm text-slate-400">
                        <div className="flex gap-4">
                            <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full mt-1.5 shadow-[0_0_8px_rgba(99,102,241,0.6)]" />
                            <p>Toutes vos données sont chiffrées de bout en bout.</p>
                        </div>
                        <div className="flex gap-4">
                            <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full mt-1.5 shadow-[0_0_8px_rgba(99,102,241,0.6)]" />
                            <p>Nous ne stockons aucun de vos messages personnels.</p>
                        </div>
                        <div className="flex gap-4">
                            <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full mt-1.5 shadow-[0_0_8px_rgba(99,102,241,0.6)]" />
                            <p>Vous pouvez révoquer l'accès à tout moment depuis votre téléphone.</p>
                        </div>
                    </div>
                </Card>

                <Card className="p-8 border-indigo-500/20 bg-gradient-to-br from-indigo-500/5 to-purple-500/5 rounded-3xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:rotate-12 transition-transform duration-500">
                        <Smartphone className="w-16 h-16 text-indigo-500" />
                    </div>
                    <h3 className="text-lg font-bold text-white mb-6">Besoin d'aide ?</h3>
                    <p className="text-sm text-slate-400 leading-relaxed mb-6">
                        Si le QR code ne s'affiche pas ou si la connexion échoue, assurez-vous que votre téléphone est connecté à Internet et réessayez.
                    </p>
                    <Button variant="link" className="text-indigo-400 p-0 h-auto font-bold border-0">
                        Consulter le guide de connexion →
                    </Button>
                </Card>
            </div>
        </div>
    )
}

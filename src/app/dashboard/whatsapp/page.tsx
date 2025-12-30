'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
    Smartphone,
    QrCode,
    CheckCircle2,
    Loader2,
    RefreshCw,
    Unplug,
    Wifi,
    WifiOff,
    Keyboard,
    Info
} from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

type ConnectionStatus = 'disconnected' | 'connecting' | 'connected'

interface WhatsAppState {
    status: ConnectionStatus
    qrCode?: string
    pairingCode?: string
    phoneNumber?: string
    message?: string
}

export default function WhatsAppPage() {
    const [state, setState] = useState<WhatsAppState>({ status: 'disconnected' })
    const [loading, setLoading] = useState(false)
    const [polling, setPolling] = useState(false)
    const [method, setMethod] = useState<'qr' | 'code'>('qr')
    const [phoneToPair, setPhoneToPair] = useState('')

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
        if (method === 'code' && !phoneToPair) {
            toast.error('Numéro requis', { description: 'Veuillez entrer votre numéro avec l\'indicatif (ex: 2376...)' })
            return
        }

        setLoading(true)
        try {
            const res = await fetch('/api/whatsapp/connect', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ phoneNumber: method === 'code' ? phoneToPair : undefined })
            })
            const data = await res.json()

            if (data.error) {
                toast.error('Erreur', {
                    description: data.details || data.error,
                    duration: 5000
                })
                return
            }

            setState(data)
            toast.info(method === 'qr' ? 'QR Code généré' : 'Demande de code envoyée')
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
                    <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-8 pb-6 border-b border-white/5">
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

                    {/* Method Toggle (Only when disconnected) */}
                    {state.status === 'disconnected' && (
                        <div className="flex justify-center mb-10">
                            <div className="bg-white/5 p-1 rounded-2xl flex gap-1">
                                <button
                                    onClick={() => setMethod('qr')}
                                    className={cn(
                                        "px-6 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2",
                                        method === 'qr' ? "bg-indigo-600 text-white shadow-lg" : "text-slate-400 hover:text-white"
                                    )}
                                >
                                    <QrCode className="w-4 h-4" />
                                    QR Code
                                </button>
                                <button
                                    onClick={() => setMethod('code')}
                                    className={cn(
                                        "px-6 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2",
                                        method === 'code' ? "bg-indigo-600 text-white shadow-lg" : "text-slate-400 hover:text-white"
                                    )}
                                >
                                    <Keyboard className="w-4 h-4" />
                                    Code de jumelage
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Displays */}
                    <AnimatePresence mode="wait">
                        {/* 1. PAIRING CODE DISPLAY */}
                        {state.status === 'connecting' && state.pairingCode ? (
                            <motion.div
                                key="code-display"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="flex flex-col items-center py-6"
                            >
                                <div className="text-center mb-8">
                                    <h4 className="text-white font-bold text-xl mb-2">Votre code de jumelage</h4>
                                    <p className="text-slate-400 text-sm">Entrez ce code sur votre téléphone</p>
                                </div>

                                <div className="flex gap-2 min-h-[80px]">
                                    {state.pairingCode.split('').map((char, i) => (
                                        <div key={i} className="w-10 h-14 md:w-12 md:h-16 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center text-2xl md:text-3xl font-black text-indigo-400 shadow-xl">
                                            {char}
                                        </div>
                                    ))}
                                </div>

                                <div className="mt-10 bg-indigo-500/10 p-6 rounded-3xl border border-indigo-500/20 max-w-sm">
                                    <div className="flex gap-3 text-sm text-indigo-200 leading-relaxed">
                                        <Info className="w-5 h-5 shrink-0" />
                                        <p>Sur WhatsApp → <span className="font-bold">Appareils connectés</span> → <span className="font-bold">Connecter un appareil</span> → <span className="underline italic text-white">Lience avec le numéro de téléphone plutôt</span></p>
                                    </div>
                                </div>
                            </motion.div>
                        ) :

                            /* 2. QR CODE DISPLAY */
                            state.status === 'connecting' && state.qrCode ? (
                                <motion.div
                                    key="qr-display"
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="flex flex-col items-center py-4"
                                >
                                    <div className="relative group">
                                        <div className="absolute inset-0 bg-indigo-500/30 blur-3xl rounded-full scale-110 animate-pulse" />
                                        <div className="relative bg-white p-5 rounded-3xl shadow-2xl border-4 border-indigo-500/20">
                                            <img src={state.qrCode} alt="QR" className="w-56 h-56 md:w-64 md:h-64 rounded-xl" />
                                        </div>
                                    </div>
                                    <div className="mt-10 text-center max-w-sm">
                                        <h4 className="text-white font-bold text-lg">Scannez ce code</h4>
                                        <p className="text-slate-400 text-sm mt-2">
                                            Ouvrez WhatsApp → <span className="text-indigo-400 font-medium">Appareils connectés</span> et scannez le code.
                                        </p>
                                    </div>
                                </motion.div>
                            ) : state.status === 'connected' ? (

                                /* 3. SUCCESS DISPLAY */
                                <motion.div
                                    key="success-display"
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="flex flex-col items-center py-10"
                                >
                                    <div className="relative w-24 h-24 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-6">
                                        <CheckCircle2 className="w-12 h-12 text-emerald-500" />
                                        <div className="absolute inset-0 bg-emerald-500/20 blur-3xl rounded-full scale-150 -z-10" />
                                    </div>
                                    <h4 className="text-2xl font-black text-white">Connexion établie !</h4>
                                    <p className="text-slate-400 text-center mt-3 max-w-xs">
                                        Votre IA est maintenant opérationnelle sur ce numéro.
                                    </p>
                                </motion.div>
                            ) : (

                                /* 4. IDLE / SETUP FORM */
                                <motion.div
                                    key="idle-display"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="flex flex-col items-center py-4"
                                >
                                    {method === 'code' ? (
                                        <div className="w-full max-w-sm space-y-4">
                                            <div className="text-center mb-6">
                                                <div className="w-16 h-16 bg-indigo-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-indigo-500/20">
                                                    <Keyboard className="w-8 h-8 text-indigo-400" />
                                                </div>
                                                <h4 className="text-white font-bold text-lg">Lien par numéro</h4>
                                                <p className="text-slate-400 text-sm px-4">Idéal si vous êtes sur mobile. Entrez votre numéro complet.</p>
                                            </div>
                                            <div className="relative group">
                                                <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-indigo-400 group-focus-within:text-white transition-colors">
                                                    <span className="font-bold text-lg">+</span>
                                                </div>
                                                <Input
                                                    placeholder="2376..."
                                                    value={phoneToPair}
                                                    onChange={(e) => setPhoneToPair(e.target.value.replace(/[^0-9]/g, ''))}
                                                    className="h-14 pl-10 bg-white/5 border-white/10 rounded-2xl text-lg font-mono focus:border-indigo-500/50 focus:ring-indigo-500/20"
                                                />
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center">
                                            <div className="w-20 h-20 rounded-[2rem] bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mb-6 rotate-12">
                                                <QrCode className="w-10 h-10 text-indigo-400" />
                                            </div>
                                            <p className="text-slate-400 text-center max-w-xs font-medium">
                                                Générez un QR Code pour synchroniser votre session directement.
                                            </p>
                                        </div>
                                    )}
                                </motion.div>
                            )}
                    </AnimatePresence>

                    {/* Action Buttons */}
                    <div className="flex flex-col sm:flex-row justify-center gap-4 mt-12">
                        {state.status === 'disconnected' && (
                            <Button
                                onClick={startConnection}
                                disabled={loading}
                                className="h-14 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl px-12 font-bold shadow-xl shadow-indigo-600/20 transition-all active:scale-95 translate-y-0 hover:-translate-y-1"
                            >
                                {loading ? <Loader2 className="w-5 h-5 mr-3 animate-spin" /> : <Smartphone className="w-5 h-5 mr-3" />}
                                {method === 'qr' ? 'Générer QR Code' : 'Obtenir mon code'}
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
                                Recommencer
                            </Button>
                        )}

                        {state.status === 'connected' && (
                            <Button
                                onClick={disconnect}
                                variant="outline"
                                className="h-14 border-red-500/30 text-red-400 hover:bg-red-500/10 rounded-2xl px-10 font-bold shadow-lg"
                            >
                                <Unplug className="w-5 h-5 mr-3" />
                                Déconnecter l'appareil
                            </Button>
                        )}
                    </div>
                </div>
            </Card>

            {/* Help Sections */}
            <div className="grid md:grid-cols-2 gap-6">
                <Card className="p-8 border-white/5 bg-[#0D0D12]/50 rounded-3xl backdrop-blur-sm">
                    <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                        <Smartphone className="w-5 h-5 text-indigo-400" />
                        Usage Mobile
                    </h3>
                    <p className="text-sm text-slate-400 leading-relaxed">
                        Si vous utilisez VibeVendor sur votre téléphone, privilégiez le <span className="text-white font-bold italic">Code de jumelage</span>. Il vous suffit d'indiquer votre numéro et de saisir le code généré dans l'application WhatsApp.
                    </p>
                </Card>

                <Card className="p-8 border-indigo-500/20 bg-gradient-to-br from-indigo-500/5 to-purple-500/5 rounded-3xl group">
                    <h3 className="text-lg font-bold text-white mb-6">Sécurité Totale</h3>
                    <p className="text-sm text-slate-400 leading-relaxed">
                        L'accès est révocable instantanément. VibeVendor n'a accès qu'aux fonctions nécessaires à votre agent IA et ne lit jamais vos conversations privées non liées.
                    </p>
                </Card>
            </div>
        </div>
    )
}

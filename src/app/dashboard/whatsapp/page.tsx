'use client'

import { useState, useEffect, useRef } from 'react'
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
    Info,
    ArrowRight,
    XCircle,
    Copy,
    Check,
    AlertTriangle,
    Clock,
    Shield,
    Zap
} from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

type ConnectionStatus = 'disconnected' | 'connecting' | 'connected'

interface WhatsAppState {
    status: ConnectionStatus
    method?: 'qr' | 'code'
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
    const [lastUsedPhone, setLastUsedPhone] = useState('')
    const [copied, setCopied] = useState(false)

    // Compteur de session
    const [sessionStartTime, setSessionStartTime] = useState<Date | null>(null)
    const [sessionDuration, setSessionDuration] = useState('00:00:00')

    // Timer de sécurité pour éviter le blocage du bouton
    const loadingTimeoutRef = useRef<NodeJS.Timeout | null>(null)

    // Vérifier le statut au chargement
    useEffect(() => {
        checkStatus()
    }, [])

    // Débloquer le bouton quand on reçoit une info ou une erreur
    useEffect(() => {
        if (state.qrCode || state.pairingCode || state.status === 'connected' || state.pairingCode === "ERREUR") {
            setLoading(false)
            if (loadingTimeoutRef.current) clearTimeout(loadingTimeoutRef.current)

            if (state.pairingCode === "ERREUR") {
                toast.error("Échec de génération", { description: "Veuillez réessayer ou rafraîchir la page." })
            }
        }
    }, [state])

    // Polling uniquement quand on attend une action ou qu'on est connecté
    useEffect(() => {
        let interval: NodeJS.Timeout

        if (state.status === 'connecting' || state.status === 'connected') {
            setPolling(true)
            interval = setInterval(checkStatus, 1500)
        } else {
            setPolling(false)
        }

        return () => {
            if (interval) clearInterval(interval)
        }
    }, [state.status])

    // Gestion du compteur de session
    useEffect(() => {
        if (state.status === 'connected') {
            // Démarrer le compteur si pas déjà démarré
            if (!sessionStartTime) {
                setSessionStartTime(new Date())
            }
        } else {
            // Réinitialiser quand déconnecté
            setSessionStartTime(null)
            setSessionDuration('00:00:00')
        }
    }, [state.status])

    // Mise à jour du compteur chaque seconde
    useEffect(() => {
        if (!sessionStartTime || state.status !== 'connected') return

        const interval = setInterval(() => {
            const now = new Date()
            const diff = Math.floor((now.getTime() - sessionStartTime.getTime()) / 1000)

            const hours = Math.floor(diff / 3600)
            const minutes = Math.floor((diff % 3600) / 60)
            const seconds = diff % 60

            setSessionDuration(
                `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
            )
        }, 1000)

        return () => clearInterval(interval)
    }, [sessionStartTime, state.status])

    const checkStatus = async () => {
        try {
            const res = await fetch('/api/whatsapp/connect')
            if (!res.ok) return
            const data = await res.json()

            if (data.status === 'connected' && state.status !== 'connected') {
                toast.success('WhatsApp connecté !')
            }

            setState(data)
        } catch (error) {
            console.error('Erreur statut:', error)
        }
    }

    const startConnection = async () => {
        if (method === 'code') {
            if (!phoneToPair) {
                toast.error('Numéro requis', { description: 'Entrez votre numéro complet.' })
                return
            }
            const clean = phoneToPair.replace(/\D/g, '')
            if (clean.length < 8) {
                toast.error('Numéro trop court', { description: 'Vérifiez l\'indicatif (ex: 237...).' })
                return
            }
            setLastUsedPhone(clean)
        }

        setLoading(true)

        // Sécurité : Si après 15s rien ne change, on libère le bouton
        if (loadingTimeoutRef.current) clearTimeout(loadingTimeoutRef.current)
        loadingTimeoutRef.current = setTimeout(() => {
            if (loading) {
                setLoading(false)
                toast.error("Le délai est dépassé", { description: "Le serveur met trop de temps. Réessayez." })
            }
        }, 15000)

        // Reset local immédiat pour forcer l'affichage du chargement si c'est une répétition
        setState(prev => ({ ...prev, pairingCode: undefined, qrCode: undefined }))

        try {
            const res = await fetch('/api/whatsapp/connect', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    phoneNumber: method === 'code' ? phoneToPair.replace(/\D/g, '') : undefined
                })
            })
            const data = await res.json()

            if (data.error) {
                toast.error('Erreur', { description: data.details || data.error })
                setLoading(false)
                if (loadingTimeoutRef.current) clearTimeout(loadingTimeoutRef.current)
                return
            }

            setState(data)
            toast.info(method === 'qr' ? 'Demande de QR Envoyée' : 'Demande de Code Envoyée')
        } catch (error) {
            toast.error('Erreur réseau')
            setLoading(false)
            if (loadingTimeoutRef.current) clearTimeout(loadingTimeoutRef.current)
        }
    }

    const disconnect = async (isCancel = false) => {
        if (!isCancel && !confirm('Voulez-vous vraiment déconnecter WhatsApp ?')) return

        setLoading(true)
        try {
            await fetch('/api/whatsapp/connect', { method: 'DELETE' })
            setState({ status: 'disconnected', pairingCode: undefined, qrCode: undefined })
            setLoading(false)
            setLastUsedPhone('')
            if (isCancel) {
                toast.info('Connexion annulée')
            } else {
                toast.success('Déconnecté avec succès')
            }
        } catch (error) {
            toast.error('Erreur de déconnexion')
            setLoading(false)
        }
    }

    const copyToClipboard = (text: string) => {
        if (!text) return
        navigator.clipboard.writeText(text)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
        toast.info('Copié dans le presse-papier')
    }

    const showStartButton = state.status === 'disconnected' || (state.status === 'connecting' && !state.qrCode && !state.pairingCode);

    return (
        <div className="max-w-3xl mx-auto space-y-8 pb-12 px-4 md:px-0">
            {/* Header */}
            <div className="text-center md:text-left pt-4">
                <h1 className="text-3xl font-black text-foreground tracking-tight">Configuration WhatsApp</h1>
                <p className="text-muted-foreground mt-2 text-lg">
                    Connectez votre appareil pour activer votre agent IA.
                </p>
            </div>

            {/* Main Connection Card */}
            <Card className="relative overflow-hidden border-white/5 bg-[#0D0D12] shadow-2xl rounded-[2.5rem] p-6 md:p-12">
                {/* Background Decoration */}
                <div className="absolute -top-24 -right-24 w-80 h-80 bg-indigo-600/10 rounded-full blur-[100px]" />
                <div className="absolute -bottom-24 -left-24 w-80 h-80 bg-emerald-600/5 rounded-full blur-[100px]" />

                <div className="relative z-10 w-full">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-10 pb-8 border-b border-white/5">
                        <div className="flex items-center gap-5">
                            <div className={cn(
                                "w-16 h-16 rounded-2xl flex items-center justify-center shadow-2xl transition-all duration-500",
                                state.status === 'connected' ? 'bg-emerald-500/20 text-emerald-500 ring-1 ring-emerald-500/50' :
                                    state.status === 'connecting' ? 'bg-amber-500/20 text-amber-500 ring-1 ring-amber-500/50' :
                                        'bg-white/5 text-slate-500 ring-1 ring-white/10'
                            )}>
                                {state.status === 'connected' ? <Wifi className="w-8 h-8" /> :
                                    state.status === 'connecting' ? <Loader2 className="w-8 h-8 animate-spin" /> :
                                        <WifiOff className="w-8 h-8" />}
                            </div>
                            <div className="text-left">
                                <h3 className="text-xl font-bold text-white tracking-tight">
                                    {state.status === 'connected' ? 'Statut : Connecté' :
                                        state.status === 'connecting' ? 'Initialisation...' :
                                            'Non Connecté'}
                                </h3>
                                <p className="text-slate-500 text-sm mt-0.5 font-mono">
                                    {state.phoneNumber ? `Numéro : +${state.phoneNumber}` : 'En attente de liaison'}
                                </p>
                            </div>
                        </div>

                        <Badge className={cn(
                            "px-5 py-2 text-xs font-bold uppercase tracking-widest rounded-full border-0",
                            state.status === 'connected' ? 'bg-emerald-500 text-white shadow-[0_0_20px_rgba(16,185,129,0.3)]' :
                                state.status === 'connecting' ? 'bg-amber-500 text-black shadow-[0_0_20px_rgba(245,158,11,0.3)]' :
                                    'bg-white/10 text-slate-400'
                        )}>
                            {state.status === 'connected' ? 'En ligne' : 'Action Requise'}
                        </Badge>
                    </div>

                    {/* Session Stats - Affiché uniquement quand connecté */}
                    {state.status === 'connected' && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5 }}
                            className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10 pb-8 border-b border-white/5"
                        >
                            {/* Compteur de session */}
                            <div className="bg-gradient-to-br from-indigo-500/10 to-purple-500/5 rounded-2xl p-5 border border-white/5">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="w-10 h-10 rounded-xl bg-indigo-500/20 flex items-center justify-center">
                                        <Clock className="w-5 h-5 text-indigo-400" />
                                    </div>
                                    <span className="text-slate-400 text-sm font-medium">Durée de session</span>
                                </div>
                                <div className="text-3xl font-black text-white font-mono tracking-tight">
                                    {sessionDuration}
                                </div>
                                <div className="text-xs text-slate-500 mt-1">Temps de connexion actif</div>
                            </div>

                            {/* Sécurité */}
                            <div className="bg-gradient-to-br from-emerald-500/10 to-green-500/5 rounded-2xl p-5 border border-white/5">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                                        <Shield className="w-5 h-5 text-emerald-400" />
                                    </div>
                                    <span className="text-slate-400 text-sm font-medium">Sécurité</span>
                                </div>
                                <div className="text-2xl font-bold text-emerald-400">
                                    Chiffré E2E
                                </div>
                                <div className="text-xs text-slate-500 mt-1">Connexion sécurisée active</div>
                            </div>

                            {/* Performance */}
                            <div className="bg-gradient-to-br from-amber-500/10 to-orange-500/5 rounded-2xl p-5 border border-white/5">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center">
                                        <Zap className="w-5 h-5 text-amber-400" />
                                    </div>
                                    <span className="text-slate-400 text-sm font-medium">Synchronisation</span>
                                </div>
                                <div className="text-2xl font-bold text-amber-400">
                                    Temps réel
                                </div>
                                <div className="text-xs text-slate-500 mt-1">Messages instantanés</div>
                            </div>
                        </motion.div>
                    )}

                    {/* Method Toggle */}
                    {state.status === 'disconnected' && (
                        <div className="flex justify-center mb-12">
                            <div className="bg-white/5 p-1.5 rounded-[1.5rem] flex gap-1 border border-white/5">
                                <button
                                    onClick={() => setMethod('qr')}
                                    className={cn(
                                        "px-8 py-3 rounded-2xl text-sm font-bold transition-all flex items-center gap-2",
                                        method === 'qr' ? "bg-indigo-600 text-white shadow-xl" : "text-slate-400 hover:text-white"
                                    )}
                                >
                                    <QrCode className="w-4 h-4" />
                                    QR Code
                                </button>
                                <button
                                    onClick={() => setMethod('code')}
                                    className={cn(
                                        "px-8 py-3 rounded-2xl text-sm font-bold transition-all flex items-center gap-2",
                                        method === 'code' ? "bg-indigo-600 text-white shadow-xl" : "text-slate-400 hover:text-white"
                                    )}
                                >
                                    <Keyboard className="w-4 h-4" />
                                    Code Appareil
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Content Display */}
                    <div className="min-h-[350px] flex flex-col items-center justify-center py-6">
                        <AnimatePresence mode="wait">
                            {/* ÉTAT : CHARGEMENT */}
                            {loading && !state.pairingCode && !state.qrCode ? (
                                <motion.div
                                    key="generating"
                                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                    className="flex flex-col items-center gap-6"
                                >
                                    <div className="relative">
                                        <div className="w-24 h-24 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <Smartphone className="w-10 h-10 text-indigo-400" />
                                        </div>
                                    </div>
                                    <div className="text-center">
                                        <h4 className="text-white font-bold text-xl">Liaison en cours...</h4>
                                        <p className="text-slate-500 text-sm mt-2">Veuillez patienter pendant que WhatsApp génère les données.</p>
                                    </div>
                                </motion.div>
                            ) :

                                /* ÉTAT : PAIRING CODE PRÊT */
                                state.status === 'connecting' && state.pairingCode && state.pairingCode !== "ERREUR" ? (
                                    <motion.div
                                        key="code-ready"
                                        initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                                        className="flex flex-col items-center w-full"
                                    >
                                        <div className="text-center mb-8">
                                            <h4 className="text-white font-black text-2xl mb-1">Votre Code de Liaison</h4>
                                            <p className="text-slate-500 text-sm">Prévu pour <span className="text-indigo-400 font-bold">+{lastUsedPhone}</span></p>
                                        </div>

                                        <div className="grid grid-cols-4 gap-3 md:flex md:gap-3 mb-10">
                                            {state.pairingCode.split('').map((char, i) => (
                                                <div key={i} className="w-14 h-18 md:w-16 md:h-22 bg-[#151520] border-2 border-indigo-500/40 rounded-2xl flex items-center justify-center text-3xl md:text-5xl font-black text-indigo-400 shadow-[0_0_40px_rgba(99,102,241,0.15)] transition-all hover:scale-105">
                                                    {char}
                                                </div>
                                            ))}
                                        </div>

                                        <div className="flex gap-4 w-full max-w-sm">
                                            <Button
                                                onClick={() => copyToClipboard(state.pairingCode!)}
                                                className="flex-1 h-14 bg-white/5 border border-white/10 hover:bg-white/10 text-white rounded-2xl font-bold"
                                            >
                                                {copied ? <Check className="w-5 h-5 mr-3" /> : <Copy className="w-5 h-5 mr-3" />}
                                                {copied ? 'Copié !' : 'Copier'}
                                            </Button>
                                        </div>

                                        <div className="mt-8 bg-amber-500/5 p-5 rounded-3xl border border-amber-500/10 max-w-sm w-full">
                                            <div className="flex gap-4 text-xs text-amber-200/60 leading-relaxed">
                                                <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />
                                                <p>Dans WhatsApp, choisissez <span className="text-amber-500 font-bold">"Lier avec le numéro de téléphone"</span> et utilisez exactement le numéro <span className="text-white font-bold underline">+{lastUsedPhone}</span>.</p>
                                            </div>
                                        </div>
                                    </motion.div>
                                ) :

                                    /* ÉTAT : QR CODE PRÊT */
                                    state.status === 'connecting' && state.qrCode ? (
                                        <motion.div key="qr-ready" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center">
                                            <div className="relative group">
                                                <div className="absolute inset-0 bg-indigo-500/20 blur-[60px] rounded-full" />
                                                <div className="relative bg-white p-6 rounded-[2.5rem] shadow-2xl">
                                                    <img src={state.qrCode} alt="QR" className="w-64 h-64 rounded-xl" />
                                                    <div className="absolute inset-0 border-[8px] border-indigo-500/10 rounded-[2.5rem]" />
                                                </div>
                                            </div>
                                            <div className="mt-10 text-center">
                                                <h4 className="text-white font-bold text-xl">Liaison par QR Code</h4>
                                                <p className="text-slate-500 text-sm mt-2 px-8">Ouvrez WhatsApp sur votre mobile, allez dans appareils connectés et scannez.</p>
                                            </div>
                                        </motion.div>
                                    ) :

                                        /* ÉTAT : CONNECTÉ */
                                        state.status === 'connected' ? (
                                            <motion.div key="connected" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center">
                                                <div className="w-32 h-32 rounded-full bg-emerald-500/10 border-2 border-emerald-500/30 flex items-center justify-center mb-8 relative">
                                                    <CheckCircle2 className="w-16 h-16 text-emerald-500 shadow-emerald-500/50" />
                                                    <div className="absolute inset-0 bg-emerald-500/20 blur-[40px] rounded-full -z-10 animate-pulse" />
                                                </div>
                                                <h4 className="text-3xl font-black text-white">IA Active !</h4>
                                                <p className="text-slate-500 text-center mt-4 max-w-xs leading-relaxed text-lg font-medium">
                                                    Votre compte WhatsApp est lié. L'IA gère maintenant vos conversations.
                                                </p>
                                            </motion.div>
                                        ) : (

                                            /* ÉTAT : FORMULAIRE INITIAL */
                                            <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="w-full max-w-sm">
                                                {method === 'code' ? (
                                                    <div className="space-y-8">
                                                        <div className="text-center">
                                                            <div className="w-20 h-20 bg-indigo-600/10 rounded-[2.5rem] flex items-center justify-center mx-auto mb-6 border border-indigo-600/20">
                                                                <Smartphone className="w-10 h-10 text-indigo-400" />
                                                            </div>
                                                            <h4 className="text-white font-bold text-xl">Quel est votre numéro ?</h4>
                                                            <p className="text-slate-500 text-sm mt-3 px-6 leading-relaxed">Entrez votre numéro complet avec l'indicatif pays <br />(<span className="text-indigo-400 italic">Ex: 2376XXXXXXXX</span>)</p>
                                                        </div>
                                                        <div className="space-y-4">
                                                            <div className="relative">
                                                                <div className="absolute inset-y-0 left-6 flex items-center pointer-events-none text-indigo-400 font-bold text-2xl">
                                                                    +
                                                                </div>
                                                                <Input
                                                                    placeholder="Indicatif + Numéro"
                                                                    value={phoneToPair}
                                                                    onChange={(e) => setPhoneToPair(e.target.value)}
                                                                    className="h-20 pl-16 bg-white/5 border-white/10 rounded-3xl text-2xl font-mono focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 text-white transition-all shadow-inner"
                                                                />
                                                            </div>
                                                            <div className="flex items-center gap-3 px-4 py-3 bg-white/5 rounded-2xl border border-white/5">
                                                                <Info className="w-5 h-5 text-slate-500 shrink-0" />
                                                                <p className="text-[11px] text-slate-500 font-medium">
                                                                    Supprimez le "+" ou les parenthèses si vous en avez mis.
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="flex flex-col items-center text-center">
                                                        <div className="w-28 h-28 rounded-[2.5rem] bg-indigo-600/10 border border-indigo-600/20 flex items-center justify-center mb-8 rotate-3 shadow-2xl transition-transform hover:rotate-0 duration-500">
                                                            <QrCode className="w-14 h-14 text-indigo-400" />
                                                        </div>
                                                        <h4 className="text-white font-bold text-xl uppercase tracking-tighter">Scan QR Code</h4>
                                                        <p className="text-slate-500 text-sm mt-4 px-10 leading-relaxed">La méthode la plus rapide si vous utilisez VibeVendor sur votre ordinateur.</p>
                                                    </div>
                                                )}
                                            </motion.div>
                                        )}
                        </AnimatePresence>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-col justify-center gap-4 mt-12 border-t border-white/5 pt-10">
                        {showStartButton && (
                            <Button
                                onClick={startConnection}
                                disabled={loading}
                                className="h-18 bg-indigo-600 hover:bg-indigo-700 text-white rounded-[2rem] px-12 font-black text-xl shadow-[0_20px_40px_rgba(79,70,229,0.3)] transition-all active:scale-95 group"
                            >
                                {loading ? (
                                    <Loader2 className="w-7 h-7 mr-4 animate-spin" />
                                ) : (
                                    <ArrowRight className="w-7 h-7 mr-4 group-hover:translate-x-2 transition-transform" />
                                )}
                                {method === 'qr' ? 'Générer le QR' : 'Obtenir mon code'}
                            </Button>
                        )}

                        {state.status === 'connecting' && (state.qrCode || state.pairingCode || loading) && (
                            <div className="flex flex-col gap-4 w-full">
                                <Button
                                    onClick={() => startConnection()}
                                    disabled={loading}
                                    variant="outline"
                                    className="h-14 border-indigo-500/20 bg-indigo-500/5 hover:bg-indigo-500/10 text-indigo-400 rounded-2xl font-bold flex items-center shadow-lg"
                                >
                                    <RefreshCw className={cn("w-5 h-5 mr-3", loading && "animate-spin")} />
                                    Relancer la demande
                                </Button>
                                <Button
                                    onClick={() => disconnect(true)}
                                    variant="ghost"
                                    className="h-14 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-2xl font-bold flex items-center"
                                >
                                    <XCircle className="w-5 h-5 mr-3" />
                                    Annuler tout
                                </Button>
                            </div>
                        )}

                        {state.status === 'connected' && (
                            <Button
                                onClick={() => disconnect(false)}
                                variant="outline"
                                className="h-16 border-red-500/20 text-red-500 hover:bg-red-500/10 rounded-3xl font-black text-lg transition-all"
                            >
                                <Unplug className="w-6 h-6 mr-4" />
                                Déconnecter VibeVendor
                            </Button>
                        )}
                    </div>
                </div>
            </Card>

            {/* Steps & Security */}
            <div className="grid md:grid-cols-2 gap-6 pb-20">
                <Card className="p-8 border-white/5 bg-[#0D0D12]/40 rounded-[2.5rem] backdrop-blur-2xl">
                    <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-3 italic">
                        <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                        Guide Express
                    </h3>
                    <ul className="text-xs text-slate-500 space-y-4">
                        <li className="flex gap-3">
                            <span className="w-5 h-5 rounded-full bg-white/5 flex items-center justify-center text-[10px] text-white shrink-0 font-bold">1</span>
                            <span>Ouvrez WhatsApp sur votre mobile principal.</span>
                        </li>
                        <li className="flex gap-3">
                            <span className="w-5 h-5 rounded-full bg-white/5 flex items-center justify-center text-[10px] text-white shrink-0 font-bold">2</span>
                            <span>Menu → Appareils connectés → Lier un appareil.</span>
                        </li>
                        <li className="flex gap-3">
                            <span className="w-5 h-5 rounded-full bg-white/5 flex items-center justify-center text-[10px] text-white shrink-0 font-bold">3</span>
                            <span>Cliquez sur "Lier avec le numéro de téléphone" tout en bas.</span>
                        </li>
                    </ul>
                </Card>

                <Card className="p-8 border-white/5 bg-[#0D0D12]/40 rounded-[2.5rem] backdrop-blur-2xl flex flex-col justify-center border-dashed border-2">
                    <div className="text-center">
                        <Badge className="bg-indigo-500/20 text-indigo-400 border-0 mb-4 px-4 py-1">
                            Chiffrement de bout en bout
                        </Badge>
                        <p className="text-[10px] text-slate-600 leading-relaxed font-mono">
                            VibeVendor utilise le protocole officiel Baileys pour garantir que vos messages ne sont lus que par votre agent IA.
                        </p>
                    </div>
                </Card>
            </div>
        </div>
    )
}

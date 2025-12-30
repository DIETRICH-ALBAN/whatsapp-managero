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
    Info,
    ArrowRight,
    XCircle,
    Copy,
    Check
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

    // Vérifier le statut au chargement
    useEffect(() => {
        checkStatus()
    }, [])

    // Débloquer le bouton quand on reçoit une info
    useEffect(() => {
        if (state.qrCode || state.pairingCode || state.status === 'connected') {
            setLoading(false)
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
                return
            }

            setState(data)
            toast.info(method === 'qr' ? 'Génération du QR...' : 'Génération du code...')
        } catch (error) {
            toast.error('Erreur de communication service')
            setLoading(false)
        }
    }

    const disconnect = async (isCancel = false) => {
        if (!isCancel && !confirm('Voulez-vous vraiment déconnecter WhatsApp ?')) return

        setLoading(true)
        try {
            await fetch('/api/whatsapp/connect', { method: 'DELETE' })
            setState({ status: 'disconnected' })
            setLoading(false)
            setLastUsedPhone('')
            if (isCancel) {
                toast.info('Connexion annulée')
            } else {
                toast.success('Appareil déconnecté')
            }
        } catch (error) {
            toast.error('Erreur lors de l\'opération')
            setLoading(false)
        }
    }

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
        toast.info('Code copié !')
    }

    const showStartButton = state.status === 'disconnected' || (state.status === 'connecting' && !state.qrCode && !state.pairingCode);

    return (
        <div className="max-w-3xl mx-auto space-y-8 pb-12 px-4 md:px-0">
            {/* Header */}
            <div className="text-center md:text-left pt-4">
                <h1 className="text-3xl font-black text-foreground tracking-tight">Connexion WhatsApp</h1>
                <p className="text-muted-foreground mt-2 text-lg">
                    Liez votre compte et laissez l'IA gérer vos ventes.
                </p>
            </div>

            {/* Main Connection Card */}
            <Card className="relative overflow-hidden border-white/5 bg-[#0D0D12] shadow-2xl rounded-[2.5rem] p-6 md:p-12">
                {/* Background Decoration */}
                <div className="absolute -top-24 -right-24 w-80 h-80 bg-indigo-600/10 rounded-full blur-[100px]" />
                <div className="absolute -bottom-24 -left-24 w-80 h-80 bg-emerald-600/5 rounded-full blur-[100px]" />

                <div className="relative z-10">
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
                                <p className="text-slate-500 text-sm mt-0.5">
                                    {state.phoneNumber ? `Numéro : +${state.phoneNumber}` : 'Aucun appareil lié'}
                                </p>
                            </div>
                        </div>

                        <Badge className={cn(
                            "px-5 py-2 text-xs font-bold uppercase tracking-widest rounded-full border-0",
                            state.status === 'connected' ? 'bg-emerald-500 text-white shadow-[0_0_20px_rgba(16,185,129,0.3)]' :
                                state.status === 'connecting' ? 'bg-amber-500 text-black shadow-[0_0_20px_rgba(245,158,11,0.3)]' :
                                    'bg-white/10 text-slate-400'
                        )}>
                            {state.status === 'connected' ? 'Opérationnel' : 'Action Requise'}
                        </Badge>
                    </div>

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
                    <div className="min-h-[320px] flex flex-col items-center justify-center">
                        <AnimatePresence mode="wait">
                            {/* ÉTAT : ATTENTE DE GÉNÉRATION */}
                            {loading && state.status === 'connecting' && !state.qrCode && !state.pairingCode ? (
                                <motion.div
                                    key="generating"
                                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                    className="flex flex-col items-center gap-6"
                                >
                                    <div className="relative">
                                        <div className="w-20 h-20 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <Smartphone className="w-8 h-8 text-indigo-400" />
                                        </div>
                                    </div>
                                    <div className="text-center">
                                        <h4 className="text-white font-bold text-xl">Calcul du code...</h4>
                                        <p className="text-slate-500 text-sm mt-2">WhatsApp valide votre numéro.</p>
                                    </div>
                                </motion.div>
                            ) :

                                /* ÉTAT : PAIRING CODE PRÊT */
                                state.status === 'connecting' && state.pairingCode ? (
                                    <motion.div
                                        key="code-ready"
                                        initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                                        className="flex flex-col items-center w-full"
                                    >
                                        <div className="text-center mb-8">
                                            <h4 className="text-white font-black text-2xl mb-1">Votre Code</h4>
                                            <p className="text-slate-500 text-sm">Prêt pour le numéro <span className="text-indigo-400 font-bold">+{lastUsedPhone}</span></p>
                                        </div>

                                        <div className="grid grid-cols-4 gap-3 md:flex md:gap-2 mb-8">
                                            {state.pairingCode.split('').map((char, i) => (
                                                <div key={i} className="w-14 h-16 md:w-16 md:h-20 bg-indigo-500/10 border-2 border-indigo-500/30 rounded-2xl flex items-center justify-center text-3xl md:text-5xl font-black text-indigo-400 shadow-[0_0_20px_rgba(99,102,241,0.2)]">
                                                    {char}
                                                </div>
                                            ))}
                                        </div>

                                        <Button
                                            onClick={() => copyToClipboard(state.pairingCode!)}
                                            variant="outline"
                                            className="mb-10 h-12 border-indigo-500/20 bg-indigo-500/5 hover:bg-indigo-500/10 text-indigo-400 rounded-xl"
                                        >
                                            {copied ? <Check className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
                                            {copied ? 'Copié' : 'Copier le code'}
                                        </Button>

                                        <div className="bg-white/5 p-6 rounded-[2rem] border border-white/5 max-w-sm w-full">
                                            <div className="flex gap-4 text-xs text-slate-400 leading-relaxed">
                                                <div className="w-6 h-6 rounded-full bg-indigo-600 flex items-center justify-center shrink-0 text-white font-bold">!</div>
                                                <p>Sur votre mobile, entrez <span className="text-white font-bold">+{lastUsedPhone}</span> quand WhatsApp vous demande le numéro.</p>
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
                                                    <div className="absolute inset-0 border-[6px] border-indigo-500/10 rounded-[2.5rem]" />
                                                </div>
                                            </div>
                                            <div className="mt-10 text-center">
                                                <h4 className="text-white font-bold text-xl">Scannez le Code</h4>
                                                <p className="text-slate-500 text-sm mt-2">Ouvrez WhatsApp et scannez ce QR.</p>
                                            </div>
                                        </motion.div>
                                    ) :

                                        /* ÉTAT : CONNECTÉ */
                                        state.status === 'connected' ? (
                                            <motion.div key="connected" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col items-center">
                                                <div className="w-28 h-28 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-8 relative">
                                                    <CheckCircle2 className="w-14 h-14 text-emerald-500" />
                                                    <div className="absolute inset-0 bg-emerald-500/20 blur-[40px] rounded-full -z-10 animate-pulse" />
                                                </div>
                                                <h4 className="text-3xl font-black text-white">Prêt à l'emploi !</h4>
                                                <p className="text-slate-500 text-center mt-4 max-w-xs leading-relaxed text-lg">
                                                    Félicitations ! Votre agent IA est actif.
                                                </p>
                                            </motion.div>
                                        ) : (

                                            /* ÉTAT : FORMULAIRE INITIAL */
                                            <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="w-full max-w-sm">
                                                {method === 'code' ? (
                                                    <div className="space-y-6">
                                                        <div className="text-center">
                                                            <div className="w-20 h-20 bg-indigo-600/10 rounded-[2rem] flex items-center justify-center mx-auto mb-6 border border-indigo-600/20">
                                                                <Smartphone className="w-10 h-10 text-indigo-400" />
                                                            </div>
                                                            <h4 className="text-white font-bold text-lg">Lier via Numéro</h4>
                                                            <p className="text-slate-500 text-sm mt-2 px-6">Entrez l'indicatif suivi du numéro.</p>
                                                        </div>
                                                        <div className="space-y-4">
                                                            <div className="relative">
                                                                <div className="absolute inset-y-0 left-6 flex items-center pointer-events-none text-indigo-400 font-bold text-xl">
                                                                    +
                                                                </div>
                                                                <Input
                                                                    placeholder="2376..."
                                                                    value={phoneToPair}
                                                                    onChange={(e) => setPhoneToPair(e.target.value)}
                                                                    className="h-16 pl-12 bg-white/5 border-white/10 rounded-2xl text-xl font-mono focus:border-indigo-500 focus:ring-indigo-500/20 text-white transition-all"
                                                                />
                                                            </div>
                                                            <p className="text-[10px] text-center text-slate-500 uppercase tracking-widest font-bold">
                                                                Exemple: 237 6XX XXX XXX
                                                            </p>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="flex flex-col items-center text-center">
                                                        <div className="w-24 h-24 rounded-[2.5rem] bg-indigo-600/10 border border-indigo-600/20 flex items-center justify-center mb-8 rotate-3 shadow-2xl">
                                                            <QrCode className="w-12 h-12 text-indigo-400" />
                                                        </div>
                                                        <h4 className="text-white font-bold text-xl">Lier via QR Code</h4>
                                                        <p className="text-slate-500 text-sm mt-3 px-8">Privilégiez cette méthode sur ordinateur.</p>
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
                                className="h-16 bg-indigo-600 hover:bg-indigo-700 text-white rounded-[1.5rem] px-12 font-black text-lg shadow-[0_15px_35px_rgba(79,70,229,0.3)] transition-all active:scale-95 group"
                            >
                                {loading ? (
                                    <Loader2 className="w-6 h-6 mr-3 animate-spin" />
                                ) : (
                                    <ArrowRight className="w-6 h-6 mr-3 group-hover:translate-x-1 transition-transform" />
                                )}
                                {method === 'qr' ? 'Générer le QR Code' : 'Obtenir mon code'}
                            </Button>
                        )}

                        {state.status === 'connecting' && (state.qrCode || state.pairingCode || loading) && (
                            <div className="flex flex-col gap-3">
                                <Button
                                    onClick={() => startConnection()}
                                    variant="outline"
                                    className="h-14 border-indigo-500/20 bg-indigo-500/5 hover:bg-indigo-500/10 text-indigo-400 rounded-[1.5rem] font-bold"
                                >
                                    <RefreshCw className={cn("w-5 h-5 mr-3", loading && "animate-spin")} />
                                    Régénérer le code
                                </Button>
                                <Button
                                    onClick={() => disconnect(true)}
                                    variant="ghost"
                                    className="h-14 text-slate-500 hover:text-red-400 hover:bg-red-500/5 rounded-[1.5rem] font-bold"
                                >
                                    <XCircle className="w-5 h-5 mr-3" />
                                    Annuler et réinitialiser
                                </Button>
                            </div>
                        )}
                    </div>
                </div>
            </Card>

            {/* Info Cards */}
            <div className="grid md:grid-cols-2 gap-4">
                <Card className="p-6 border-white/5 bg-white/5 rounded-3xl">
                    <h3 className="text-white font-bold mb-2 flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                        Numéro envoyé
                    </h3>
                    <p className="text-sm text-slate-400">
                        {lastUsedPhone ? `Le code a été généré pour le numéro : +${lastUsedPhone}` : "Aucun numéro envoyé pour l'instant."}
                    </p>
                </Card>
                <Card className="p-6 border-white/5 bg-white/5 rounded-3xl">
                    <h3 className="text-white font-bold mb-2 flex items-center gap-2">
                        <Info className="w-4 h-4 text-indigo-400" />
                        Aide Connexion
                    </h3>
                    <p className="text-xs text-slate-400">
                        Si WhatsApp rejette le numéro, vérifiez qu'il est identique à celui du formulaire.
                    </p>
                </Card>
            </div>
        </div>
    )
}

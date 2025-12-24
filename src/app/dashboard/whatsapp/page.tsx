'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
    Smartphone,
    QrCode,
    CheckCircle2,
    XCircle,
    Loader2,
    RefreshCw,
    Unplug,
    Wifi,
    WifiOff
} from 'lucide-react'
import { toast } from 'sonner'

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

        if (state.status === 'connecting') {
            setPolling(true)
            interval = setInterval(checkStatus, 3000) // Toutes les 3 secondes
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
                    description: `Numéro: ${data.phoneNumber}`
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
                toast.error('Erreur', { description: data.error })
                return
            }

            setState(data)

            if (data.qrCode) {
                toast.info('QR Code prêt', { description: 'Scannez-le avec WhatsApp' })
            }
        } catch (error) {
            toast.error('Erreur de connexion')
        } finally {
            setLoading(false)
        }
    }

    const disconnect = async () => {
        setLoading(true)
        try {
            await fetch('/api/whatsapp/connect', { method: 'DELETE' })
            setState({ status: 'disconnected' })
            toast.success('WhatsApp déconnecté')
        } catch (error) {
            toast.error('Erreur lors de la déconnexion')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="max-w-2xl mx-auto space-y-8">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-foreground">Connexion WhatsApp</h1>
                <p className="text-muted-foreground mt-1">
                    Connectez votre numéro WhatsApp pour permettre à l'agent IA de répondre à vos clients.
                </p>
            </div>

            {/* Status Card */}
            <Card className="p-8 border-border bg-card">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <div className={`p-3 rounded-xl ${state.status === 'connected' ? 'bg-emerald-500/10' :
                                state.status === 'connecting' ? 'bg-amber-500/10' :
                                    'bg-slate-500/10'
                            }`}>
                            {state.status === 'connected' ?
                                <Wifi className="w-6 h-6 text-emerald-500" /> :
                                state.status === 'connecting' ?
                                    <Loader2 className="w-6 h-6 text-amber-500 animate-spin" /> :
                                    <WifiOff className="w-6 h-6 text-slate-400" />
                            }
                        </div>
                        <div>
                            <h3 className="font-semibold text-foreground">
                                {state.status === 'connected' ? 'Connecté' :
                                    state.status === 'connecting' ? 'En attente...' :
                                        'Non connecté'}
                            </h3>
                            {state.phoneNumber && (
                                <p className="text-sm text-muted-foreground">+{state.phoneNumber}</p>
                            )}
                        </div>
                    </div>

                    <Badge
                        variant="outline"
                        className={
                            state.status === 'connected' ? 'border-emerald-500/50 text-emerald-500' :
                                state.status === 'connecting' ? 'border-amber-500/50 text-amber-500' :
                                    'border-muted-foreground/50 text-muted-foreground'
                        }
                    >
                        {state.status === 'connected' ? 'Actif' :
                            state.status === 'connecting' ? 'Scan requis' :
                                'Inactif'}
                    </Badge>
                </div>

                {/* QR Code Display */}
                <AnimatePresence mode="wait">
                    {state.status === 'connecting' && state.qrCode && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className="flex flex-col items-center py-8"
                        >
                            <div className="relative">
                                <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 blur-2xl rounded-full" />
                                <div className="relative bg-white p-4 rounded-2xl shadow-xl">
                                    <img
                                        src={state.qrCode}
                                        alt="QR Code WhatsApp"
                                        className="w-64 h-64"
                                    />
                                </div>
                            </div>
                            <div className="mt-6 text-center">
                                <p className="text-foreground font-medium">Scannez ce QR code</p>
                                <p className="text-sm text-muted-foreground mt-1">
                                    Ouvrez WhatsApp → Menu → Appareils connectés → Connecter un appareil
                                </p>
                            </div>
                            {polling && (
                                <div className="flex items-center gap-2 mt-4 text-sm text-muted-foreground">
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    <span>En attente du scan...</span>
                                </div>
                            )}
                        </motion.div>
                    )}

                    {state.status === 'connected' && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="flex flex-col items-center py-8"
                        >
                            <div className="w-20 h-20 rounded-full bg-emerald-500/10 flex items-center justify-center mb-4">
                                <CheckCircle2 className="w-10 h-10 text-emerald-500" />
                            </div>
                            <p className="text-foreground font-medium">WhatsApp connecté avec succès !</p>
                            <p className="text-sm text-muted-foreground mt-1">
                                L'agent peut maintenant recevoir et répondre aux messages.
                            </p>
                        </motion.div>
                    )}

                    {state.status === 'disconnected' && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="flex flex-col items-center py-8"
                        >
                            <div className="w-20 h-20 rounded-full bg-slate-500/10 flex items-center justify-center mb-4">
                                <QrCode className="w-10 h-10 text-slate-400" />
                            </div>
                            <p className="text-muted-foreground">
                                Cliquez sur le bouton ci-dessous pour générer un QR code
                            </p>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Actions */}
                <div className="flex justify-center gap-3 mt-6">
                    {state.status === 'disconnected' && (
                        <Button
                            onClick={startConnection}
                            disabled={loading}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl px-8"
                        >
                            {loading ? (
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            ) : (
                                <Smartphone className="w-4 h-4 mr-2" />
                            )}
                            Connecter WhatsApp
                        </Button>
                    )}

                    {state.status === 'connecting' && (
                        <Button
                            onClick={startConnection}
                            variant="outline"
                            disabled={loading}
                            className="rounded-xl"
                        >
                            <RefreshCw className="w-4 h-4 mr-2" />
                            Nouveau QR Code
                        </Button>
                    )}

                    {state.status === 'connected' && (
                        <Button
                            onClick={disconnect}
                            variant="outline"
                            disabled={loading}
                            className="border-red-500/50 text-red-500 hover:bg-red-500/10 rounded-xl"
                        >
                            {loading ? (
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            ) : (
                                <Unplug className="w-4 h-4 mr-2" />
                            )}
                            Déconnecter
                        </Button>
                    )}
                </div>
            </Card>

            {/* Info Card */}
            <Card className="p-6 border-border bg-card/50">
                <h3 className="font-semibold text-foreground mb-3">Comment ça marche ?</h3>
                <ol className="space-y-3 text-sm text-muted-foreground">
                    <li className="flex gap-3">
                        <span className="flex-shrink-0 w-6 h-6 rounded-full bg-indigo-500/10 text-indigo-500 flex items-center justify-center text-xs font-bold">1</span>
                        <span>Cliquez sur "Connecter WhatsApp" pour générer un QR code unique.</span>
                    </li>
                    <li className="flex gap-3">
                        <span className="flex-shrink-0 w-6 h-6 rounded-full bg-indigo-500/10 text-indigo-500 flex items-center justify-center text-xs font-bold">2</span>
                        <span>Ouvrez WhatsApp sur votre téléphone et allez dans Paramètres → Appareils connectés.</span>
                    </li>
                    <li className="flex gap-3">
                        <span className="flex-shrink-0 w-6 h-6 rounded-full bg-indigo-500/10 text-indigo-500 flex items-center justify-center text-xs font-bold">3</span>
                        <span>Scannez le QR code affiché ici. Votre agent sera immédiatement opérationnel !</span>
                    </li>
                </ol>
            </Card>
        </div>
    )
}

'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Check, Zap, Crown, Rocket, CreditCard, Receipt } from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

const plans = [
    {
        name: 'Basic',
        price: 'Gratuit',
        description: 'Pour démarrer',
        features: [
            '100 messages IA/mois',
            '1 agent IA',
            'Support email',
            'Connexion WhatsApp'
        ],
        icon: Zap,
        current: true
    },
    {
        name: 'Pro',
        price: '15 000 FCFA',
        period: '/mois',
        description: 'Pour les entrepreneurs',
        features: [
            'Messages IA illimités',
            '5 agents IA',
            'Support prioritaire',
            'Analytiques avancées',
            'Export des données',
            'Intégration API'
        ],
        icon: Crown,
        popular: true
    },
    {
        name: 'Enterprise',
        price: 'Sur mesure',
        description: 'Pour les équipes',
        features: [
            'Tout de Pro',
            'Agents illimités',
            'Support dédié 24/7',
            'SLA garanti',
            'Formation équipe',
            'Multi-utilisateurs'
        ],
        icon: Rocket
    }
]

export default function BillingPage() {
    const [selectedPlan, setSelectedPlan] = useState('Basic')

    const handleUpgrade = (planName: string) => {
        toast.info(`Upgrade vers ${planName}`, {
            description: 'Cette fonctionnalité sera bientôt disponible !'
        })
    }

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-2xl font-bold">Facturation</h1>
                <p className="text-muted-foreground">Gérez votre abonnement et vos paiements.</p>
            </div>

            {/* Current Plan */}
            <Card className="bg-gradient-to-r from-indigo-500/10 to-purple-500/10 border-indigo-500/20">
                <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                            <Badge className="bg-indigo-500 mb-2">Plan Actuel</Badge>
                            <h3 className="text-xl font-bold">Basic - Gratuit</h3>
                            <p className="text-muted-foreground text-sm mt-1">Vous utilisez 47/100 messages IA ce mois-ci</p>
                        </div>
                        <Button className="bg-indigo-600 hover:bg-indigo-700">
                            <Crown className="w-4 h-4 mr-2" />
                            Passer à Pro
                        </Button>
                    </div>
                    <div className="mt-4 h-2 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-indigo-500 rounded-full" style={{ width: '47%' }} />
                    </div>
                </CardContent>
            </Card>

            {/* Plans Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {plans.map((plan) => (
                    <Card
                        key={plan.name}
                        className={cn(
                            "relative overflow-hidden transition-all hover:shadow-lg",
                            plan.popular && "border-indigo-500 shadow-indigo-500/10",
                            plan.current && "ring-2 ring-indigo-500"
                        )}
                    >
                        {plan.popular && (
                            <div className="absolute top-4 right-4">
                                <Badge className="bg-indigo-500">Populaire</Badge>
                            </div>
                        )}
                        <CardHeader>
                            <div className={cn(
                                "w-12 h-12 rounded-xl flex items-center justify-center mb-4",
                                plan.current ? "bg-indigo-500 text-white" : "bg-muted"
                            )}>
                                <plan.icon className="w-6 h-6" />
                            </div>
                            <CardTitle>{plan.name}</CardTitle>
                            <CardDescription>{plan.description}</CardDescription>
                            <div className="mt-4">
                                <span className="text-3xl font-bold">{plan.price}</span>
                                {plan.period && <span className="text-muted-foreground">{plan.period}</span>}
                            </div>
                        </CardHeader>
                        <CardContent>
                            <ul className="space-y-3 mb-6">
                                {plan.features.map((feature, i) => (
                                    <li key={i} className="flex items-center gap-2 text-sm">
                                        <Check className="w-4 h-4 text-emerald-500" />
                                        {feature}
                                    </li>
                                ))}
                            </ul>
                            <Button
                                className="w-full"
                                variant={plan.current ? "outline" : "default"}
                                disabled={plan.current}
                                onClick={() => handleUpgrade(plan.name)}
                            >
                                {plan.current ? 'Plan actuel' : 'Choisir ce plan'}
                            </Button>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Payment History */}
            <Card>
                <CardHeader>
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500">
                            <Receipt className="w-5 h-5" />
                        </div>
                        <div>
                            <CardTitle>Historique des paiements</CardTitle>
                            <CardDescription>Vos factures récentes</CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="text-center py-8 text-muted-foreground">
                        <CreditCard className="w-12 h-12 mx-auto mb-4 opacity-20" />
                        <p>Aucun paiement enregistré</p>
                        <p className="text-sm mt-1">Vos factures apparaîtront ici.</p>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}

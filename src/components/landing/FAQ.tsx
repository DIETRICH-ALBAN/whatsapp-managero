'use client'

import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion"

const faqs = [
    {
        q: "Qu'est-ce que VibeVendor ?",
        a: "C'est une app web IA qui aide les commerçants et PME au Cameroun à gérer automatiquement les commandes via WhatsApp. Elle répond 24/7 aux messages, évite les pertes de ventes et évolue vers une gestion complète de boutique (livraisons, inventaire)."
    },
    {
        q: "Comment m'inscrire ?",
        a: "Cliquez sur 'Démarrer Gratuitement', créez un compte (Email/Google), connectez votre WhatsApp Business (5 min) et configurez vos templates. Pas de carte requise pour l'essai."
    },
    {
        q: "Quels sont les prix ?",
        a: "3 plans : Gratuit (Essai 1 semaine), Basique (5.000 FCFA/mois) et Pro (15.000 FCFA/mois). Paiements via Mobile Money (Orange, MTN) ou Carte. -20% si paiement annuel."
    },
    {
        q: "Compatible au Cameroun ?",
        a: "Oui ! S'intègre parfaitement à WhatsApp Business et fonctionne sur tous les réseaux locaux (MTN, Orange). Supporte le Français, l'Anglais et le Pidgin."
    },
    {
        q: "Mes données sont-elles sécurisées ?",
        a: "Absolument. Nous utilisons HTTPS et le chiffrement Supabase. Vos clés API restent privées. Conformité RGPD adaptée au Cameroun."
    },
    {
        q: "Quel support offrez-vous ?",
        a: "Support email gratuit pour tous (<24h). Chat live et priorité (<2h) pour le plan Pro. Vidéos tutoriels disponibles en français."
    },
    {
        q: "Limites de l'essai gratuit ?",
        a: "50 messages/jour, 5 templates IA, dashboard simple. Après 7 jours, passage en mode 'lite' sans perte de données, invitant à l'upgrade."
    },
    {
        q: "Gérer une boutique complète ?",
        a: "Oui, c'est la vision. Le plan Pro inclut déjà l'inventaire IA. Bientôt : suivi livraisons (Jumia/Glovo) et multi-canaux (Facebook, SMS)."
    }
]

export function FAQ() {
    return (
        <section className="py-24 bg-background-deep relative overflow-hidden">
            {/* Background Grid Illusion (Comme sur l'image) */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:50px_50px] [mask-image:radial-gradient(ellipse_at_center,black_40%,transparent_80%)] pointer-events-none" />

            <div className="container mx-auto px-4 relative z-10">
                <div className="text-center mb-16">
                    <div className="inline-block px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-bold mb-4">
                        FAQ
                    </div>
                    <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-4">
                        Questions Fréquentes
                    </h2>
                    <p className="text-muted-foreground">Trouvez des réponses rapides sur votre assistant IA.</p>
                </div>

                <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-4">
                    {/* Colonne Gauche */}
                    <div className="space-y-4">
                        {faqs.slice(0, 4).map((faq, i) => (
                            <FAQItem key={i} q={faq.q} a={faq.a} value={`left-${i}`} />
                        ))}
                    </div>

                    {/* Colonne Droite */}
                    <div className="space-y-4">
                        {faqs.slice(4, 8).map((faq, i) => (
                            <FAQItem key={i} q={faq.q} a={faq.a} value={`right-${i}`} />
                        ))}
                    </div>
                </div>
            </div>
        </section>
    )
}

function FAQItem({ q, a, value }: { q: string, a: string, value: string }) {
    return (
        <Accordion type="single" collapsible className="w-full">
            <AccordionItem value={value} className="bg-card border border-border rounded-xl px-6 hover:border-primary/30 transition-colors data-[state=open]:bg-primary/5 data-[state=open]:border-primary/50">
                <AccordionTrigger className="text-foreground hover:text-primary hover:no-underline text-left py-6 font-medium text-base">
                    {q}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground leading-relaxed pb-6">
                    {a}
                </AccordionContent>
            </AccordionItem>
        </Accordion>
    )
}

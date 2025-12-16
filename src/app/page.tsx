'use client'

import { Button } from '@/components/ui/button'
import { DashboardCard } from '@/components/dashboard/DashboardCard'
import { MessageCard } from '@/components/dashboard/MessageCard'
import { motion } from 'framer-motion'
import { staggerContainer, fadeInUp } from '@/lib/animations'
import { MessageCircle, Users, Package, TrendingUp, Sparkles } from 'lucide-react'

// Exemple de données
const sampleMessages = [
  { id: '1', senderName: 'Marie Dupont', preview: 'Bonjour, je voudrais commander 3 paires de chaussures...', timestamp: '14:32', isUnread: true },
  { id: '2', senderName: 'Jean Kamga', preview: 'Le prix de la chemise bleue ?', timestamp: '13:45', isUnread: true },
  { id: '3', senderName: 'Fatou Ndiaye', preview: 'Merci pour la livraison rapide !', timestamp: '11:20', isUnread: false },
  { id: '4', senderName: 'Paul Essono', preview: 'Est-ce que vous avez la taille 44 ?', timestamp: 'Hier', isUnread: false },
]

export default function Home() {
  return (
    <main className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 px-6">
        {/* Gradient Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-50 via-white to-violet-50 dark:from-slate-900 dark:via-slate-900 dark:to-indigo-950" />

        {/* Animated Gradient Orbs */}
        <div className="absolute top-20 left-10 w-72 h-72 bg-indigo-400/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-violet-400/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />

        <motion.div
          className="relative max-w-6xl mx-auto text-center"
          variants={staggerContainer}
          initial="initial"
          animate="animate"
        >
          <motion.div variants={fadeInUp} className="mb-4">
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 text-sm font-medium">
              <Sparkles className="w-4 h-4" />
              Nouveau : IA Commerciale Intégrée
            </span>
          </motion.div>

          <motion.h1
            variants={fadeInUp}
            className="text-5xl md:text-7xl font-bold mb-6"
          >
            <span className="text-gradient">WhatsApp Manager</span>
          </motion.h1>

          <motion.p
            variants={fadeInUp}
            className="text-xl md:text-2xl mb-10 max-w-2xl mx-auto"
            style={{ color: 'var(--foreground-muted)' }}
          >
            Transformez vos conversations WhatsApp en ventes.
            Votre assistant commercial intelligent qui travaille 24h/24.
          </motion.p>

          <motion.div variants={fadeInUp} className="flex flex-wrap gap-4 justify-center">
            <Button size="lg">
              Démarrer Gratuitement
            </Button>
            <Button variant="outline" size="lg">
              Voir la Démo
            </Button>
          </motion.div>
        </motion.div>
      </section>

      {/* Dashboard Preview Section */}
      <section className="py-20 px-6 bg-slate-50 dark:bg-slate-900/50">
        <div className="max-w-6xl mx-auto">
          <motion.div
            className="text-center mb-12"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Votre Tableau de Bord
            </h2>
            <p style={{ color: 'var(--foreground-muted)' }}>
              Visualisez vos performances en temps réel
            </p>
          </motion.div>

          {/* Dashboard Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <DashboardCard
              title="Messages Aujourd'hui"
              value="42"
              description="12 en attente"
              icon={MessageCircle}
              trend={{ value: 12, isPositive: true }}
              delay={0.1}
            />
            <DashboardCard
              title="Clients Actifs"
              value="156"
              description="Ce mois"
              icon={Users}
              trend={{ value: 8, isPositive: true }}
              delay={0.2}
            />
            <DashboardCard
              title="Commandes"
              value="23"
              description="Cette semaine"
              icon={Package}
              trend={{ value: 5, isPositive: true }}
              delay={0.3}
            />
            <DashboardCard
              title="Chiffre d'Affaires"
              value="2.4M"
              description="FCFA ce mois"
              icon={TrendingUp}
              trend={{ value: 18, isPositive: true }}
              delay={0.4}
            />
          </div>

          {/* Messages Card */}
          <div className="max-w-2xl mx-auto">
            <MessageCard messages={sampleMessages} delay={0.5} />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 border-t border-slate-200 dark:border-slate-800">
        <div className="max-w-6xl mx-auto text-center text-sm" style={{ color: 'var(--foreground-muted)' }}>
          <p>© 2024 WhatsApp Manager SaaS. Conçu pour les entrepreneurs africains.</p>
        </div>
      </footer>
    </main>
  )
}

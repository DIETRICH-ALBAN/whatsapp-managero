# 📱 WhatsApp Manager SaaS

> **Plateforme intelligente de gestion commerciale WhatsApp pour PME africaines**

[![Next.js](https://img.shields.io/badge/Next.js-16.0-black?logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.0-38bdf8?logo=tailwind-css)](https://tailwindcss.com/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E?logo=supabase)](https://supabase.com/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

---

## 🌟 Vision

Transformer chaque conversation WhatsApp en opportunité commerciale grâce à une plateforme SaaS qui combine **intelligence artificielle**, **gestion de stock** et **CRM** dans une interface moderne et intuitive.

**Objectif :** Permettre aux entrepreneurs camerounais et africains de gérer efficacement leurs ventes WhatsApp 24h/24, 7j/7.

---

## ✨ Fonctionnalités

### 🚀 MVP (En cours)

- ✅ **Interface Moderne** : Design bleu-violet avec animations Framer Motion
- ✅ **Smooth Scroll** : Navigation fluide avec Lenis
- ✅ **Composants UI** : Bibliothèque de composants réutilisables (Cards, Buttons, Inputs)
- ✅ **Logging Centralisé** : Winston pour le débogage et la traçabilité
- ✅ **Dashboard Preview** : Aperçu des KPIs et messages

### 🔮 Roadmap

#### Phase 1 : Authentification & Sécurité
- [ ] Connexion Email/Password
- [ ] OAuth Google
- [ ] Gestion de sessions (Supabase Auth)
- [ ] Middleware de protection de routes

#### Phase 2 : Module "Secrétaire" (Inbox WhatsApp)
- [ ] Réception de messages en temps réel (Webhook)
- [ ] Interface de chat type WhatsApp
- [ ] Marquage de messages (lu/non-lu, important)
- [ ] Filtres et recherche
- [ ] Notifications push

#### Phase 3 : Module "Sales" (IA Commerciale)
- [ ] Réponses automatiques intelligentes
- [ ] Gestion du catalogue produits
- [ ] Calcul automatique de prix
- [ ] Suivi des commandes
- [ ] Statistiques de ventes

#### Phase 4 : Module "Marketing"
- [ ] Campagnes de diffusion WhatsApp
- [ ] Segmentation de clients
- [ ] Analytics avancés
- [ ] A/B Testing

---

## 🛠️ Stack Technique

| Catégorie | Technologies |
|-----------|-------------|
| **Frontend** | Next.js 16 (App Router), React 19, TypeScript |
| **Styling** | Tailwind CSS v4, CSS Variables, Framer Motion |
| **Backend** | Next.js API Routes, Supabase Edge Functions |
| **Base de Données** | Supabase (PostgreSQL) |
| **Auth** | Supabase Auth (PKCE Flow) |
| **Real-time** | Supabase Realtime |
| **Animations** | Framer Motion, Lenis (Smooth Scroll) |
| **UI Components** | Radix UI, Shadcn/ui |
| **Logging** | Winston |
| **Icons** | Lucide React |
| **3D (Futur)** | Spline (@splinetool/react-spline) |

---

## 📦 Installation

### Prérequis

- **Node.js** : v18+ ([Télécharger](https://nodejs.org/))
- **Git** : ([Télécharger](https://git-scm.com/))
- **Compte Supabase** : ([Créer](https://supabase.com/))

### Étapes

1. **Cloner le dépôt**
   ```bash
   git clone https://github.com/mihawk-san/whatsapp-managero.git
   cd whatsapp-managero
   ```

2. **Installer les dépendances**
   ```bash
   npm install
   ```

3. **Configuration des variables d'environnement**
   
   Créez un fichier `.env.local` à la racine :
   ```env
   # Supabase
   NEXT_PUBLIC_SUPABASE_URL=votre_url_supabase
   NEXT_PUBLIC_SUPABASE_ANON_KEY=votre_cle_anon
   SUPABASE_SERVICE_ROLE_KEY=votre_cle_service

   # WhatsApp Business API (Meta)
   WHATSAPP_VERIFY_TOKEN=votre_token_verification
   WHATSAPP_API_TOKEN=votre_token_api
   WHATSAPP_PHONE_ID=votre_phone_number_id

   # Optionnel
   LOG_LEVEL=info
   ```

4. **Lancer le serveur de développement**
   ```bash
   npm run dev
   ```

5. **Ouvrir dans le navigateur**
   ```
   http://localhost:3000
   ```

---

## 📂 Structure du Projet

```
whatsapp-managero/
├── src/
│   ├── app/                      # Routes Next.js (App Router)
│   │   ├── page.tsx              # Page d'accueil
│   │   ├── layout.tsx            # Layout racine
│   │   ├── globals.css           # Styles globaux (Tailwind + Thème)
│   │   └── api/                  # API Routes
│   ├── components/
│   │   ├── ui/                   # Composants UI réutilisables
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   ├── input.tsx
│   │   │   └── label.tsx
│   │   ├── dashboard/            # Composants Dashboard
│   │   │   ├── DashboardCard.tsx
│   │   │   └── MessageCard.tsx
│   │   └── providers/            # Context Providers
│   │       └── SmoothScrollProvider.tsx
│   ├── lib/
│   │   ├── supabase.ts           # Client Supabase (Browser)
│   │   ├── supabase-admin.ts     # Client Admin (Server)
│   │   ├── logger.ts             # Winston Logger
│   │   ├── animations.tsx        # Framer Motion presets
│   │   └── utils.ts              # Utilitaires (cn, etc.)
│   └── types/                    # Types TypeScript
├── scripts/
│   └── checkpoint.js             # Script de commit automatique avec logs
├── public/                       # Assets statiques
├── .env.local                    # Variables d'environnement (à créer)
├── .gitignore                    # Fichiers à ignorer
├── package.json                  # Dépendances
├── tsconfig.json                 # Config TypeScript
└── README.md                     # Ce fichier
```

---

## 🎨 Design System

### Palette de Couleurs (Bleu-Violet Business)

```css
/* Primary */
--primary: #6366f1;           /* Indigo-500 */
--primary-hover: #4f46e5;     /* Indigo-600 */

/* Secondary */
--secondary: #8b5cf6;          /* Violet-500 */

/* Accent */
--accent: #06b6d4;             /* Cyan-500 */
```

### Composants Clés

- **Card Variants** : `default`, `glass`, `gradient`, `elevated`
- **Button Variants** : `default`, `secondary`, `outline`, `ghost`, `destructive`
- **Animations** : `fadeIn`, `fadeInUp`, `scaleIn`, `slideInLeft`, `hoverLift`

---

## 🚀 Commandes Utiles

| Commande | Description |
|----------|-------------|
| `npm run dev` | Lancer le serveur de développement |
| `npm run build` | Build pour la production |
| `npm run start` | Lancer le serveur de production |
| `npm run lint` | Linter le code |
| `npm run checkpoint "Message"` | Créer un checkpoint Git avec logs |

---

## 📝 Configuration Supabase

### Tables nécessaires (à créer)

```sql
-- Table users (gérée par Supabase Auth)

-- Table conversations
CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id),
  phone_number TEXT NOT NULL,
  last_message TEXT,
  last_message_at TIMESTAMPTZ,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table messages
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID REFERENCES conversations(id),
  sender TEXT NOT NULL, -- 'client' ou 'business'
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table products
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id),
  name TEXT NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  stock_quantity INTEGER DEFAULT 0,
  description TEXT,
  image_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 🤝 Contribution

Les contributions sont les bienvenues ! Veuillez suivre ces étapes :

1. Fork le projet
2. Créez une branche pour votre fonctionnalité (`git checkout -b feature/AmazingFeature`)
3. Commitez vos changements (`npm run checkpoint "Ajout de AmazingFeature"`)
4. Pushez vers la branche (`git push origin feature/AmazingFeature`)
5. Ouvrez une Pull Request

---

## 📄 Licence

Ce projet est sous licence **MIT**. Voir le fichier [LICENSE](LICENSE) pour plus de détails.

---

## 👨‍💻 Auteur

**Dietrich Alban** ([@mihawk-san](https://github.com/mihawk-san))

*Développé avec ❤️ pour les entrepreneurs africains*

---

## 📞 Contact & Support

- **Email** : dietrichdragon@gmail.com
- **GitHub Issues** : [Créer une issue](https://github.com/mihawk-san/whatsapp-managero/issues)
- **Documentation** : [Voir GUIDE_INSTALLATION.md](./GUIDE_INSTALLATION.md)

---

## 🙏 Remerciements

- [Next.js](https://nextjs.org/) - Framework React
- [Supabase](https://supabase.com/) - Backend as a Service
- [Tailwind CSS](https://tailwindcss.com/) - Framework CSS
- [Shadcn/ui](https://ui.shadcn.com/) - Composants UI
- [Framer Motion](https://www.framer.com/motion/) - Animations
- [Meta WhatsApp Business](https://developers.facebook.com/docs/whatsapp) - API WhatsApp

---

<div align="center">
  <strong>⭐ Si ce projet vous aide, n'hésitez pas à lui donner une étoile sur GitHub !</strong>
</div>

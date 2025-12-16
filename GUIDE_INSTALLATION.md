# Guide de Configuration - WhatsApp Manager SaaS (MVP)

Félicitations ! Le code source de votre MVP est prêt. Voici les étapes techniques pour rendre l'application fonctionnelle.

## 1. Base de Données (Supabase)

1.  Connectez-vous à votre projet Supabase.
2.  Allez dans **SQL Editor**.
3.  Ouvrez le fichier local `supabase/schema.sql` (créé dans le projet).
4.  Copiez tout le contenu et exécutez-le dans l'éditeur SQL de Supabase.
    *   *Cela créera les tables `profiles`, `conversations`, `messages` et les politiques de sécurité (RLS).*

## 2. Variables d'Environnement

Créez un fichier `.env.local` à la racine du projet (`C:\projets\app_de_messagerie\.env.local`) et remplissez les valeurs suivantes :

```env
# Supabase (Paramètres Projet -> API)
NEXT_PUBLIC_SUPABASE_URL=https://votre-projet.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=votre-cle-anon-publique
SUPABASE_SERVICE_ROLE_KEY=votre-cle-service-role-secrete  # ATTENTION: Ne jamais exposer coté client !

# WhatsApp API (Meta for Developers)
WHATSAPP_API_TOKEN=votre-access-token-permanent
WHATSAPP_PHONE_ID=votre-phone-number-id
WHATSAPP_VERIFY_TOKEN=mon_super_token_de_verification     # Choisissez une valeur secrète
```

## 3. Lancer en Local

```bash
npm run dev
```
L'application sera accessible sur `http://localhost:3000`.

## 4. Tests Webhook (Local)

Pour recevoir les messages WhatsApp en local, vous avez besoin d'un tunnel comme **ngrok** :

1.  Installez ngrok.
2.  Lancez : `ngrok http 3000`
3.  Copiez l'URL HTTPS générée (ex: `https://abcd-123.ngrok.io`).
4.  Dans le dashboard Meta Developers (WhatsApp > Configuration) :
    *   **Callback URL** : `https://abcd-123.ngrok.io/api/webhook/whatsapp`
    *   **Verify Token** : La valeur de `WHATSAPP_VERIFY_TOKEN` (ex: `mon_super_token_de_verification`)
    *   Cliquez sur **Verify and Save**.

## 5. Simulation

*   Envoyez un message WhatsApp au numéro de test configuré.
*   Le message devrait apparaître dans le Dashboard (`/dashboard`) en temps réel.
*   L'IA devrait répondre automatiquement selon les règles définies dans `src/services/ai.ts`.

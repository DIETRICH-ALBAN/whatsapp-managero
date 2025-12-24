# WhatsApp Service (Microservice Baileys)

Ce dossier contient un microservice indépendant pour gérer les connexions WhatsApp via Baileys.
Il est conçu pour être déployé sur **Railway**, **Render**, ou tout service supportant les connexions persistantes.

## Pourquoi un service séparé ?

Vercel (serverless) a un timeout de ~30s, ce qui est insuffisant pour maintenir une connexion WebSocket WhatsApp.
Ce microservice tourne en permanence et communique avec l'app principale via API REST.

## Déploiement sur Railway

1. Créez un compte sur [Railway](https://railway.app)
2. Créez un nouveau projet
3. Connectez ce repo GitHub
4. Dans les settings, définissez le "Root Directory" à `/whatsapp-service`
5. Ajoutez les variables d'environnement (voir `.env.example`)
6. Déployez !

## Variables d'environnement

```env
SUPABASE_URL=https://votre-projet.supabase.co
SUPABASE_SERVICE_KEY=votre-service-role-key
PORT=3001
```

## API Endpoints

- `POST /connect/:userId` - Démarre une session WhatsApp
- `GET /status/:userId` - Récupère le statut de connexion
- `DELETE /disconnect/:userId` - Déconnecte WhatsApp
- `POST /send/:userId` - Envoie un message

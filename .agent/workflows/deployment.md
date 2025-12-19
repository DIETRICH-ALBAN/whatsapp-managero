---
description: Procédure de déploiement continu sur Vercel
---
# Déploiement Automatique sur Vercel

Votre projet est configuré pour le déploiement continu (CI/CD) via GitHub et Vercel.

Chaque fois que vous poussez des modifications sur la branche `main` de GitHub, Vercel détecte le changement, construit l'application et la met à jour en direct.

## Comment déployer une nouvelle version

1. **Effectuez vos modifications** dans le code.
2. **Validez (Commit)** vos changements :
   ```bash
   git add -A
   git commit -m "Description de vos changements"
   ```
3. **Poussez (Push)** vers GitHub :
   ```bash
   git push origin main
   ```

## Vérification

- Allez sur votre tableau de bord Vercel pour voir le statut du déploiement.
- Une fois le cercle de statut vert, votre site est à jour à l'adresse de production.

## Bonnes Pratiques

- **Testez toujours en local** (`npm run dev`) avant de push.
- Utilisez des messages de commit clairs (ex: `feat: ajout dashboard`, `fix: correction navbar`).
- Si un déploiement échoue, Vercel vous enverra un email avec les logs d'erreur.

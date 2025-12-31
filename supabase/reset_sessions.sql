-- VIDER LES SESSIONS WHATSAPP POUR FORCER UNE NOUVELLE CONNEXION
-- Exécutez ceci dans Supabase SQL Editor si vous êtes bloqué dans une boucle de connexion.

TRUNCATE TABLE whatsapp_sessions;

-- Si vous voulez supprimer seulement une session spécifique (optionnel)
-- DELETE FROM whatsapp_sessions WHERE user_id = 'VOTRE_USER_ID';

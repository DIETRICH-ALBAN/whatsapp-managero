-- ============================================
-- CORRECTION DU BUCKET whatsapp-media
-- Exécutez ce script dans Supabase SQL Editor
-- ============================================

-- 1. S'assurer que le bucket existe et est public
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'whatsapp-media', 
    'whatsapp-media', 
    true,
    52428800, -- 50MB max
    ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'video/quicktime', 'audio/mpeg', 'audio/ogg', 'audio/wav', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
)
ON CONFLICT (id) DO UPDATE SET 
    public = true,
    file_size_limit = 52428800;

-- 2. Supprimer les anciennes policies
DROP POLICY IF EXISTS "Public Upload" ON storage.objects;
DROP POLICY IF EXISTS "Public View" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated uploads" ON storage.objects;
DROP POLICY IF EXISTS "Allow public read" ON storage.objects;

-- 3. Créer les nouvelles policies permissives
-- Autoriser les utilisateurs authentifiés à uploader
CREATE POLICY "Allow authenticated uploads" 
ON storage.objects FOR INSERT 
TO authenticated
WITH CHECK (bucket_id = 'whatsapp-media');

-- Autoriser tout le monde à voir les fichiers (car le bucket est public)
CREATE POLICY "Allow public read" 
ON storage.objects FOR SELECT 
TO public
USING (bucket_id = 'whatsapp-media');

-- Autoriser les utilisateurs authentifiés à supprimer leurs fichiers
CREATE POLICY "Allow authenticated delete" 
ON storage.objects FOR DELETE 
TO authenticated
USING (bucket_id = 'whatsapp-media');

-- ============================================
-- VÉRIFICATION DES COLONNES MESSAGES
-- S'assurer que les colonnes média existent
-- ============================================
ALTER TABLE messages ADD COLUMN IF NOT EXISTS message_type TEXT DEFAULT 'text';
ALTER TABLE messages ADD COLUMN IF NOT EXISTS media_url TEXT;

-- ============================================
-- PERSISTANCE SESSION WHATSAPP
-- ============================================
ALTER TABLE whatsapp_sessions ADD COLUMN IF NOT EXISTS session_data TEXT;

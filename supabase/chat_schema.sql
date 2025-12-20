-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. ASSURER QUE LA TABLE CONVERSATIONS EXISTE
CREATE TABLE IF NOT EXISTS conversations (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    contact_phone TEXT NOT NULL UNIQUE
);

-- 2. AJOUTER LES COLONNES MANQUANTES (Méthode robuste)
DO $$ 
BEGIN 
    -- created_at
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='conversations' AND column_name='created_at') THEN
        ALTER TABLE conversations ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL;
    END IF;

    -- updated_at
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='conversations' AND column_name='updated_at') THEN
        ALTER TABLE conversations ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL;
    END IF;

    -- contact_name
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='conversations' AND column_name='contact_name') THEN
        ALTER TABLE conversations ADD COLUMN contact_name TEXT;
    END IF;

    -- last_message
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='conversations' AND column_name='last_message') THEN
        ALTER TABLE conversations ADD COLUMN last_message TEXT;
    END IF;

    -- last_message_at
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='conversations' AND column_name='last_message_at') THEN
        ALTER TABLE conversations ADD COLUMN last_message_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now());
    END IF;

    -- unread_count
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='conversations' AND column_name='unread_count') THEN
        ALTER TABLE conversations ADD COLUMN unread_count INTEGER DEFAULT 0;
    END IF;

    -- status
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='conversations' AND column_name='status') THEN
        ALTER TABLE conversations ADD COLUMN status TEXT CHECK (status IN ('active', 'archived', 'blocked')) DEFAULT 'active';
    END IF;

    -- user_id (Optionnel)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='conversations' AND column_name='user_id') THEN
        ALTER TABLE conversations ADD COLUMN user_id UUID REFERENCES auth.users(id);
    END IF;
END $$;


-- 3. LIER LA TABLE MESSAGES (Si elle existe)
DO $$ 
BEGIN 
    -- Assurer que la table messages a la colonne conversation_id
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='messages' AND column_name='conversation_id') THEN
        ALTER TABLE messages ADD COLUMN conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE;
    END IF;
END $$;


-- 4. CRÉER LES INDEX (Supprimer s'ils existent déjà pour éviter les erreurs, puis recréer)
DROP INDEX IF EXISTS idx_conversations_updated_at;
CREATE INDEX idx_conversations_updated_at ON conversations(updated_at DESC);

DROP INDEX IF EXISTS idx_messages_conversation_id;
CREATE INDEX idx_messages_conversation_id ON messages(conversation_id);

DROP INDEX IF EXISTS idx_conversations_contact_phone;
CREATE INDEX idx_conversations_contact_phone ON conversations(contact_phone);

-- 5. SÉCURITÉ (RLS)
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Supprimer les anciennes policies pour éviter les conflits
DROP POLICY IF EXISTS "Admins can view all conversations" ON conversations;
DROP POLICY IF EXISTS "Admins can view all messages" ON messages;
DROP POLICY IF EXISTS "Users can view their own messages" ON messages; 

-- Créer les nouvelles policies
CREATE POLICY "Admins can view all conversations" ON conversations FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Admins can view all messages" ON messages FOR ALL USING (auth.role() = 'authenticated');

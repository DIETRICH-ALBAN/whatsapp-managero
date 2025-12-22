-- ==============================================================================
-- SCRIPT MAÎTRE : ARCHITECTURE COMPLÈTE VIBE (WhatsApp Manager)
-- Version : 2.0 (Migration Baileys + E-commerce + Chat)
-- ==============================================================================

-- ⚠️ ATTENTION : CE SCRIPT RÉINITIALISE LES DONNÉES MÉTIER (Pas les utilisateurs Auth)
-- À exécuter dans Supabase SQL Editor

BEGIN;

-- 1. ACTIVATION DES EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. NETTOYAGE (Ordre inverse des dépendances)
DROP TABLE IF EXISTS messages CASCADE;
DROP TABLE IF EXISTS conversations CASCADE;
DROP TABLE IF EXISTS whatsapp_session_keys CASCADE;
DROP TABLE IF EXISTS whatsapp_sessions CASCADE;
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;

-- 3. GESTION UTILISATEURS (Profils publics liés à auth.users)
CREATE TABLE profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT,
    full_name TEXT,
    avatar_url TEXT,
    subscription_plan TEXT DEFAULT 'free', -- free, pro, enterprise
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Trigger pour créer un profil automatiquement à l'inscription
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (new.id, new.email, new.raw_user_meta_data->>'full_name');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();


-- 4. SYSTÈME WHATSAPP (Connexion & Sessions Baileys)
CREATE TABLE whatsapp_sessions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    creds TEXT, -- JSON des identifiants (token, noise keys, etc)
    phone_number TEXT,
    is_connected BOOLEAN DEFAULT false,
    last_connected_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id) -- Une seule session par utilisateur pour le MVP
);

CREATE TABLE whatsapp_session_keys (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    session_id UUID REFERENCES whatsapp_sessions(id) ON DELETE CASCADE NOT NULL,
    key_id TEXT NOT NULL,
    key_data TEXT NOT NULL, -- Clés pré-signées, identités (E2E encryption)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(session_id, key_id)
);


-- 5. SYSTÈME DE MESSAGERIE (Chat CRM)
CREATE TABLE conversations (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL, -- Propriétaire du dashboard
    contact_phone TEXT NOT NULL,
    contact_name TEXT,
    last_message TEXT,
    last_message_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    unread_count INTEGER DEFAULT 0,
    status TEXT CHECK (status IN ('active', 'archived', 'blocked')) DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id, contact_phone) -- Un contact est unique POUR un utilisateur donné
);

CREATE TABLE messages (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE NOT NULL,
    contact_phone TEXT NOT NULL, -- Redondance pour perf
    content TEXT,
    message_type TEXT DEFAULT 'text', -- text, image, audio, video
    direction TEXT CHECK (direction IN ('inbound', 'outbound')) NOT NULL,
    status TEXT CHECK (status IN ('sent', 'delivered', 'read', 'failed', 'received')) DEFAULT 'sent',
    is_ai_generated BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);


-- 6. E-COMMERCE (Produits & Commandes)
CREATE TABLE products (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL,
    image_url TEXT,
    inventory_count INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE orders (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    contact_phone TEXT NOT NULL,
    total_amount DECIMAL(10, 2) DEFAULT 0,
    status TEXT CHECK (status IN ('pending', 'paid', 'shipped', 'cancelled')) DEFAULT 'pending',
    items JSONB, -- Stockage simple des items commandés: [{productId, quantity, price}]
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);


-- 7. SÉCURITÉ (Row Level Security - RLS)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_session_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Politiques (Chaque utilisateur voit SA donnée)
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users manage own sessions" ON whatsapp_sessions FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users manage own session keys" ON whatsapp_session_keys FOR ALL USING (
    session_id IN (SELECT id FROM whatsapp_sessions WHERE user_id = auth.uid())
);

CREATE POLICY "Users manage own conversations" ON conversations FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users manage own messages" ON messages FOR ALL USING (
    conversation_id IN (SELECT id FROM conversations WHERE user_id = auth.uid())
);

CREATE POLICY "Users manage own products" ON products FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users manage own orders" ON orders FOR ALL USING (auth.uid() = user_id);


-- 8. INDEX & PERFORMANCES
CREATE INDEX idx_conversations_user_updated ON conversations(user_id, updated_at DESC);
CREATE INDEX idx_messages_conversation ON messages(conversation_id, created_at ASC);
CREATE INDEX idx_sessions_user ON whatsapp_sessions(user_id);

COMMIT;

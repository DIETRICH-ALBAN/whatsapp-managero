-- Table pour stocker les sessions WhatsApp (Auth State de Baileys)
CREATE TABLE IF NOT EXISTS whatsapp_sessions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    
    -- Credentials Baileys (JSON sérialisé)
    creds TEXT,
    
    -- Métadonnées de session
    phone_number TEXT,
    is_connected BOOLEAN DEFAULT false,
    last_connected_at TIMESTAMP WITH TIME ZONE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    
    UNIQUE(user_id)
);

-- Table pour stocker les clés de session (keys de Baileys)
CREATE TABLE IF NOT EXISTS whatsapp_session_keys (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    session_id UUID REFERENCES whatsapp_sessions(id) ON DELETE CASCADE NOT NULL,
    
    key_id TEXT NOT NULL,
    key_data TEXT NOT NULL,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    
    UNIQUE(session_id, key_id)
);

-- Index pour la performance
CREATE INDEX IF NOT EXISTS idx_whatsapp_sessions_user_id ON whatsapp_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_session_keys_session_id ON whatsapp_session_keys(session_id);

-- RLS
ALTER TABLE whatsapp_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_session_keys ENABLE ROW LEVEL SECURITY;

-- Policies : Chaque utilisateur ne voit que sa propre session
DROP POLICY IF EXISTS "Users can manage their own session" ON whatsapp_sessions;
CREATE POLICY "Users can manage their own session" ON whatsapp_sessions 
    FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage their own keys" ON whatsapp_session_keys;
CREATE POLICY "Users can manage their own keys" ON whatsapp_session_keys 
    FOR ALL USING (
        session_id IN (SELECT id FROM whatsapp_sessions WHERE user_id = auth.uid())
    );

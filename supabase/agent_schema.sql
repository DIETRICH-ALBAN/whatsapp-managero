-- MIGRATION: Ajout de la configuration de l'Agent IA
BEGIN;

CREATE TABLE agent_configs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    name TEXT DEFAULT 'Mon Assistant',
    system_prompt TEXT DEFAULT 'Tu es un assistant commercial utile et courtois.',
    model TEXT DEFAULT 'gpt-4o-mini',
    is_active BOOLEAN DEFAULT false,
    temperature DECIMAL(3, 2) DEFAULT 0.7,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id) -- Un seul agent par utilisateur pour l'instant
);

-- RLS
ALTER TABLE agent_configs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own agent config" ON agent_configs 
    FOR ALL USING (auth.uid() = user_id);

COMMIT;

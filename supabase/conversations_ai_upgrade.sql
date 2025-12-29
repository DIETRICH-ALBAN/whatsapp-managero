-- Mise à jour des conversations pour l'intelligence IA
-- 1. Ajouter la référence à l'agent configuré pour cette conversation
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS agent_id UUID REFERENCES agent_configs(id) ON DELETE SET NULL;

-- 2. Ajouter les colonnes de tagging intelligent
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS intent_tag TEXT; -- ex: 'high_intent', 'support', 'question'
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS priority_score INTEGER DEFAULT 0;
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS is_ai_enabled BOOLEAN DEFAULT true;

-- 3. Ajouter une colonne pour le résumé automatique (pour le widget futur)
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS summary TEXT;

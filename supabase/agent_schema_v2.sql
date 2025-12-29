-- Mise à jour du schéma pour supporter plusieurs templates d'agents
-- 1. Supprimer la contrainte d'unicité sur user_id
ALTER TABLE agent_configs DROP CONSTRAINT IF EXISTS agent_configs_user_id_key;

-- 2. Ajouter les nouvelles colonnes
ALTER TABLE agent_configs ADD COLUMN IF NOT EXISTS is_default BOOLEAN DEFAULT false;
ALTER TABLE agent_configs ADD COLUMN IF NOT EXISTS description TEXT;

-- 3. S'assurer qu'un seul agent est par défaut par utilisateur
CREATE OR REPLACE FUNCTION set_default_agent()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.is_default THEN
        UPDATE agent_configs
        SET is_default = false
        WHERE user_id = NEW.user_id AND id <> NEW.id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_set_default_agent ON agent_configs;
CREATE TRIGGER trg_set_default_agent
BEFORE INSERT OR UPDATE OF is_default ON agent_configs
FOR EACH ROW
WHEN (NEW.is_default = true)
EXECUTE FUNCTION set_default_agent();

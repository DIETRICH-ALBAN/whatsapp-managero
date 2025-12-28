-- Fonction pour incrémenter le compteur de messages non lus
CREATE OR REPLACE FUNCTION increment_unread_count(convo_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE conversations
  SET unread_count = unread_count + 1,
      updated_at = now()
  WHERE id = convo_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

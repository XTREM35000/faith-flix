-- Ajouter trigger pour générer automatiquement le slug pour les événements
-- Basé sur le pattern utilisé pour les vidéos

-- Créer la fonction si elle n'existe pas
CREATE OR REPLACE FUNCTION generate_event_slug()
RETURNS TRIGGER AS $$
BEGIN
  -- Générer un slug à partir du titre si slug est NULL
  IF NEW.slug IS NULL THEN
    NEW.slug := LOWER(
      REGEXP_REPLACE(
        REGEXP_REPLACE(
          NEW.title,
          '[^a-z0-9\s\-]',
          '',
          'gi'
        ),
        '[\s\-]+',
        '-',
        'g'
      )
    );
    -- S'assurer que le slug n'est pas vide
    IF NEW.slug = '' OR NEW.slug IS NULL THEN
      NEW.slug := 'event-' || NEW.id;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Créer le trigger
-- Créer le trigger uniquement si la table events existe
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'events') THEN
        DROP TRIGGER IF EXISTS generate_event_slug_trigger ON events;
        CREATE TRIGGER generate_event_slug_trigger
        BEFORE INSERT OR UPDATE ON events
        FOR EACH ROW
        EXECUTE FUNCTION generate_event_slug();
    END IF;
END $$;
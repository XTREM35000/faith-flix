-- migrations/20260327_add_developer_management.sql
-- ============================================
-- COMPLÈTE L'EXISTANT SANS RIEN CASSER
-- ============================================

-- 1. Vérifier et créer les fonctions de gestion si elles n'existent pas
-- (chaque fonction est créée avec OR REPLACE, donc sans erreur)

-- Supprimer une paroisse (soft delete)
CREATE OR REPLACE FUNCTION public.delete_parish(parish_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'developer') THEN
        RAISE EXCEPTION 'Unauthorized: Only developer can delete parishes';
    END IF;
    
    UPDATE public.parishes
    SET deleted_at = NOW(), status = 'revoked'
    WHERE id = parish_id;
    
    RETURN FOUND;
END;
$$;

-- Mettre en pause une paroisse
CREATE OR REPLACE FUNCTION public.pause_parish(parish_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'developer') THEN
        RAISE EXCEPTION 'Unauthorized: Only developer can pause parishes';
    END IF;
    
    UPDATE public.parishes
    SET status = 'paused'
    WHERE id = parish_id;
    
    RETURN FOUND;
END;
$$;

-- Réactiver une paroisse
CREATE OR REPLACE FUNCTION public.activate_parish(parish_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'developer') THEN
        RAISE EXCEPTION 'Unauthorized: Only developer can activate parishes';
    END IF;
    
    UPDATE public.parishes
    SET status = 'active'
    WHERE id = parish_id;
    
    RETURN FOUND;
END;
$$;

-- Révoquer une paroisse (alias de delete pour compatibilité)
CREATE OR REPLACE FUNCTION public.revoke_parish(parish_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN public.delete_parish(parish_id);
END;
$$;


-- 2. Trigger pour ajouter le developer aux nouvelles paroisses
CREATE OR REPLACE FUNCTION public.add_developer_to_new_parish()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    dev_profile_id UUID;
BEGIN
    -- Récupérer l'ID du profil developer
    SELECT id INTO dev_profile_id FROM public.profiles WHERE role = 'developer' LIMIT 1;
    
    IF dev_profile_id IS NOT NULL THEN
        -- Ajouter le developer comme membre avec rôle 'developer'
        INSERT INTO public.parish_members (parish_id, user_id, role)
        VALUES (NEW.id, dev_profile_id, 'developer')
        ON CONFLICT (parish_id, user_id) DO NOTHING;
    END IF;
    
    RETURN NEW;
END;
$$;

-- Créer le trigger (sans casser l'existant)
DROP TRIGGER IF EXISTS trigger_add_developer_to_parish ON public.parishes;
CREATE TRIGGER trigger_add_developer_to_parish
    AFTER INSERT ON public.parishes
    FOR EACH ROW
    EXECUTE FUNCTION public.add_developer_to_new_parish();


-- 3. Ajouter le developer à toutes les paroisses existantes (si ce n'est pas déjà fait)
INSERT INTO public.parish_members (parish_id, user_id, role)
SELECT 
    p.id,
    dev.id,
    'developer'
FROM public.parishes p
CROSS JOIN (SELECT id FROM public.profiles WHERE role = 'developer' LIMIT 1) dev
WHERE NOT EXISTS (
    SELECT 1 FROM public.parish_members pm
    WHERE pm.parish_id = p.id AND pm.user_id = dev.id
)
ON CONFLICT (parish_id, user_id) DO NOTHING;


-- 4. Vérification finale
SELECT 
    '✅ Developer exists' as check,
    COUNT(*) as developer_count
FROM public.profiles 
WHERE role = 'developer'
UNION ALL
SELECT 
    '✅ Parishes count' as check,
    COUNT(*)::text
FROM public.parishes
WHERE deleted_at IS NULL
UNION ALL
SELECT 
    '✅ Developer memberships' as check,
    COUNT(*)::text
FROM public.parish_members pm
JOIN public.profiles p ON p.id = pm.user_id
WHERE p.role = 'developer';
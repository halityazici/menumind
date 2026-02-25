-- =============================================================
-- MenuMind — Full Security & Performance Migration
-- Fixes: RLS Errors + auth_rls_initplan + multiple_permissive_policies
-- Run in Supabase SQL Editor
-- =============================================================

-- ─────────────────────────────────────────────────────────────
-- 1. Enable RLS on all tables
-- ─────────────────────────────────────────────────────────────
ALTER TABLE public.menu          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.page_sessions ENABLE ROW LEVEL SECURITY;

-- ─────────────────────────────────────────────────────────────
-- 2. Drop ALL existing policies (clean slate)
-- ─────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "menu_select_all"      ON public.menu;
DROP POLICY IF EXISTS "menu_select_public"   ON public.menu;
DROP POLICY IF EXISTS "menu_insert_anon"     ON public.menu;
DROP POLICY IF EXISTS "menu_update_anon"     ON public.menu;
DROP POLICY IF EXISTS "menu_delete_anon"     ON public.menu;
DROP POLICY IF EXISTS "menu_insert_auth"     ON public.menu;
DROP POLICY IF EXISTS "menu_update_auth"     ON public.menu;
DROP POLICY IF EXISTS "menu_delete_auth"     ON public.menu;

DROP POLICY IF EXISTS "allow_anon_insert"    ON public.orders;
DROP POLICY IF EXISTS "orders_insert_anon"   ON public.orders;
DROP POLICY IF EXISTS "orders_select_anon"   ON public.orders;
DROP POLICY IF EXISTS "orders_select_auth"   ON public.orders;
DROP POLICY IF EXISTS "orders_update_anon"   ON public.orders;
DROP POLICY IF EXISTS "orders_delete_anon"   ON public.orders;
DROP POLICY IF EXISTS "orders_update_auth"   ON public.orders;
DROP POLICY IF EXISTS "orders_delete_auth"   ON public.orders;

DROP POLICY IF EXISTS "sessions_insert_anon" ON public.page_sessions;
DROP POLICY IF EXISTS "sessions_select_anon" ON public.page_sessions;
DROP POLICY IF EXISTS "sessions_update_anon" ON public.page_sessions;

DROP POLICY IF EXISTS "settings_insert_auth" ON public.settings;
DROP POLICY IF EXISTS "settings_update_auth" ON public.settings;

-- ─────────────────────────────────────────────────────────────
-- 3. public.menu — tek SELECT policy, yazma yalnız authenticated
--    (select auth.role()) → her satır için tekrar değerlendirmeyi önler
-- ─────────────────────────────────────────────────────────────
CREATE POLICY "menu_select_public" ON public.menu
    FOR SELECT TO anon, authenticated
    USING (true);

CREATE POLICY "menu_insert_auth" ON public.menu
    FOR INSERT TO authenticated
    WITH CHECK ((select auth.role()) = 'authenticated');

CREATE POLICY "menu_update_auth" ON public.menu
    FOR UPDATE TO authenticated
    USING ((select auth.role()) = 'authenticated')
    WITH CHECK ((select auth.role()) = 'authenticated');

CREATE POLICY "menu_delete_auth" ON public.menu
    FOR DELETE TO authenticated
    USING ((select auth.role()) = 'authenticated');

-- ─────────────────────────────────────────────────────────────
-- 4. public.orders
--    • INSERT → anon (müşteri sipariş verir) — kasıtlı açık
--    • SELECT → tek policy, hem anon hem authenticated
--    • UPDATE/DELETE → yalnız authenticated (admin)
-- ─────────────────────────────────────────────────────────────
CREATE POLICY "orders_insert_anon" ON public.orders
    FOR INSERT TO anon, authenticated
    WITH CHECK (true);

CREATE POLICY "orders_select_anon" ON public.orders
    FOR SELECT TO anon, authenticated
    USING (true);

CREATE POLICY "orders_update_auth" ON public.orders
    FOR UPDATE TO authenticated
    USING ((select auth.role()) = 'authenticated')
    WITH CHECK ((select auth.role()) = 'authenticated');

CREATE POLICY "orders_delete_auth" ON public.orders
    FOR DELETE TO authenticated
    USING ((select auth.role()) = 'authenticated');

-- ─────────────────────────────────────────────────────────────
-- 5. public.page_sessions — tamamen anon (analytics tracking)
--    Bu politikalar kasıtlı olarak USING (true) içerir.
-- ─────────────────────────────────────────────────────────────
CREATE POLICY "sessions_insert_anon" ON public.page_sessions
    FOR INSERT TO anon, authenticated
    WITH CHECK (true);

CREATE POLICY "sessions_select_anon" ON public.page_sessions
    FOR SELECT TO anon, authenticated
    USING (true);

CREATE POLICY "sessions_update_anon" ON public.page_sessions
    FOR UPDATE TO anon, authenticated
    USING (true)
    WITH CHECK (true);

-- ─────────────────────────────────────────────────────────────
-- 6. public.settings — yalnız authenticated yazabilir
-- ─────────────────────────────────────────────────────────────
CREATE POLICY "settings_insert_auth" ON public.settings
    FOR INSERT TO authenticated
    WITH CHECK ((select auth.role()) = 'authenticated');

CREATE POLICY "settings_update_auth" ON public.settings
    FOR UPDATE TO authenticated
    USING ((select auth.role()) = 'authenticated')
    WITH CHECK ((select auth.role()) = 'authenticated');

-- ─────────────────────────────────────────────────────────────
-- 7. update_updated_at fonksiyonu — search_path sabitle
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;

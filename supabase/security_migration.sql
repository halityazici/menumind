-- =============================================================
-- MenuMind — Security Migration
-- Fixes: RLS Disabled + Function Search Path Mutable
-- =============================================================

-- ─────────────────────────────────────────────────────────────
-- 1. Enable RLS on all tables
-- ─────────────────────────────────────────────────────────────
ALTER TABLE public.menu          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.page_sessions ENABLE ROW LEVEL SECURITY;

-- ─────────────────────────────────────────────────────────────
-- 2. Drop existing policies (clean slate, avoid duplicates)
-- ─────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "menu_select_public"  ON public.menu;
DROP POLICY IF EXISTS "menu_insert_anon"    ON public.menu;
DROP POLICY IF EXISTS "menu_update_anon"    ON public.menu;
DROP POLICY IF EXISTS "menu_delete_anon"    ON public.menu;

DROP POLICY IF EXISTS "orders_insert_anon"  ON public.orders;
DROP POLICY IF EXISTS "orders_select_anon"  ON public.orders;
DROP POLICY IF EXISTS "orders_update_anon"  ON public.orders;
DROP POLICY IF EXISTS "orders_delete_anon"  ON public.orders;

DROP POLICY IF EXISTS "sessions_insert_anon" ON public.page_sessions;
DROP POLICY IF EXISTS "sessions_select_anon" ON public.page_sessions;
DROP POLICY IF EXISTS "sessions_update_anon" ON public.page_sessions;

-- ─────────────────────────────────────────────────────────────
-- 3. public.menu policies
--    • SELECT  → herkese açık (müşteriler menüyü görür)
--    • INSERT / UPDATE / DELETE → anon (admin, Supabase Auth
--      kullanmadan anon anahtarıyla yönetir)
-- ─────────────────────────────────────────────────────────────
CREATE POLICY "menu_select_public"
    ON public.menu FOR SELECT
    TO anon, authenticated
    USING (true);

CREATE POLICY "menu_insert_anon"
    ON public.menu FOR INSERT
    TO anon, authenticated
    WITH CHECK (true);

CREATE POLICY "menu_update_anon"
    ON public.menu FOR UPDATE
    TO anon, authenticated
    USING (true)
    WITH CHECK (true);

CREATE POLICY "menu_delete_anon"
    ON public.menu FOR DELETE
    TO anon, authenticated
    USING (true);

-- ─────────────────────────────────────────────────────────────
-- 4. public.orders policies
--    • INSERT → müşteriler sipariş verebilir (anon)
--    • SELECT / UPDATE / DELETE → admin (anon anahtarıyla)
-- ─────────────────────────────────────────────────────────────
CREATE POLICY "orders_insert_anon"
    ON public.orders FOR INSERT
    TO anon, authenticated
    WITH CHECK (true);

CREATE POLICY "orders_select_anon"
    ON public.orders FOR SELECT
    TO anon, authenticated
    USING (true);

CREATE POLICY "orders_update_anon"
    ON public.orders FOR UPDATE
    TO anon, authenticated
    USING (true)
    WITH CHECK (true);

CREATE POLICY "orders_delete_anon"
    ON public.orders FOR DELETE
    TO anon, authenticated
    USING (true);

-- ─────────────────────────────────────────────────────────────
-- 5. public.page_sessions policies
--    • INSERT → müşteri oturumu kaydı (anon)
--    • SELECT / UPDATE → analitik paneli (anon)
-- ─────────────────────────────────────────────────────────────
CREATE POLICY "sessions_insert_anon"
    ON public.page_sessions FOR INSERT
    TO anon, authenticated
    WITH CHECK (true);

CREATE POLICY "sessions_select_anon"
    ON public.page_sessions FOR SELECT
    TO anon, authenticated
    USING (true);

CREATE POLICY "sessions_update_anon"
    ON public.page_sessions FOR UPDATE
    TO anon, authenticated
    USING (true)
    WITH CHECK (true);

-- ─────────────────────────────────────────────────────────────
-- 6. Fix: Function Search Path Mutable
--    public.update_updated_at → SET search_path = '' + schema-qualify
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

-- ================================================
-- MenuMind Database Schema
-- Run this in your Supabase SQL Editor
-- ================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ------------------------------------------------
-- TABLE: menu
-- ------------------------------------------------
CREATE TABLE IF NOT EXISTS menu (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        TEXT NOT NULL,
  description TEXT,
  price       NUMERIC(10, 2) NOT NULL DEFAULT 0,
  category    TEXT NOT NULL DEFAULT 'Genel',
  allergens   TEXT[] DEFAULT '{}',   -- e.g. ARRAY['Gluten', 'Süt']
  is_available BOOLEAN NOT NULL DEFAULT true,
  image_url   TEXT,
  sort_order  INTEGER DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ------------------------------------------------
-- TABLE: orders
-- ------------------------------------------------
CREATE TABLE IF NOT EXISTS orders (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  items           JSONB NOT NULL DEFAULT '[]',   -- [{id, name, price, qty}]
  total           NUMERIC(10, 2) NOT NULL DEFAULT 0,
  customer_note   TEXT,
  table_no        TEXT,
  status          TEXT NOT NULL DEFAULT 'new'
                    CHECK (status IN ('new', 'preparing', 'served', 'cancelled')),
  notified        BOOLEAN NOT NULL DEFAULT false,  -- Telegram sent?
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ------------------------------------------------
-- TABLE: settings
-- ------------------------------------------------
CREATE TABLE IF NOT EXISTS settings (
  key         TEXT PRIMARY KEY,
  value       TEXT,
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ------------------------------------------------
-- ROW LEVEL SECURITY
-- ------------------------------------------------
ALTER TABLE menu     ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders   ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- Menu: anyone can read, only authenticated can write
CREATE POLICY "menu_select_all"   ON menu   FOR SELECT USING (true);
CREATE POLICY "menu_insert_auth"  ON menu   FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "menu_update_auth"  ON menu   FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "menu_delete_auth"  ON menu   FOR DELETE USING (auth.role() = 'authenticated');

-- Orders: anyone can insert (customers), only authenticated can read/update
CREATE POLICY "orders_insert_all"  ON orders FOR INSERT WITH CHECK (true);
CREATE POLICY "orders_select_auth" ON orders FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "orders_update_auth" ON orders FOR UPDATE USING (auth.role() = 'authenticated');

-- Settings: anyone can read, only authenticated can write
CREATE POLICY "settings_select_all"  ON settings FOR SELECT USING (true);
CREATE POLICY "settings_insert_auth" ON settings FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "settings_update_auth" ON settings FOR UPDATE USING (auth.role() = 'authenticated');

-- ------------------------------------------------
-- AUTO-UPDATE updated_at TRIGGER
-- ------------------------------------------------
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER menu_updated_at
  BEFORE UPDATE ON menu
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER settings_updated_at
  BEFORE UPDATE ON settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ------------------------------------------------
-- SEED: Default Settings
-- ------------------------------------------------
INSERT INTO settings (key, value) VALUES
  ('restaurant_name',  'MenuMind Restoran'),
  ('welcome_message',  'Merhaba! Ben sizin yapay zeka destekli menü asistanınızım 🤖✨ Size bugün ne önerebilirim?'),
  ('telegram_chat_id', ''),
  ('primary_color',    '#7c6af7')
ON CONFLICT (key) DO NOTHING;

-- ------------------------------------------------
-- SEED: Sample Menu Items
-- ------------------------------------------------
INSERT INTO menu (name, description, price, category, allergens, sort_order) VALUES
  ('🥗 Akdeniz Salatası',   'Taze domates, salatalık, zeytin, beyaz peynir ve zeytinyağı',          89.00,  'Başlangıçlar',  ARRAY['Süt'],                      1),
  ('🍲 Mercimek Çorbası',   'Geleneksel kırmızı mercimek çorbası, naneli tahin ile servis edilir',   75.00,  'Başlangıçlar',  ARRAY[]::TEXT[],                   2),
  ('🥩 Izgara Köfte',       '180g ızgara köfte, yanında pilav ve közlenmiş sebzeler ile',           195.00, 'Ana Yemekler',   ARRAY['Gluten'],                   3),
  ('🐟 Levrek Fileto',      'Taze levrek fileto, limon tereyağı sosu ve garnitür ile',              249.00, 'Ana Yemekler',   ARRAY['Süt', 'Balık'],             4),
  ('🍝 Mantarlı Makarna',   'Sote mantar, krem sos ve parmesan ile penne makarna',                  155.00, 'Ana Yemekler',   ARRAY['Gluten', 'Süt'],            5),
  ('🍮 Sütlaç',              'Fırında üzeri kızarmış, geleneksel Türk tatlısı',                      85.00,  'Tatlılar',      ARRAY['Süt'],                      6),
  ('🍫 Sufle',               'Sıcak çikolatalı sufle, vanilyalı dondurma ile',                       95.00,  'Tatlılar',      ARRAY['Gluten', 'Süt', 'Yumurta'], 7),
  ('☕ Türk Kahvesi',        'Geleneksel fincan Türk kahvesi, lokum ile',                             45.00,  'İçecekler',     ARRAY[]::TEXT[],                   8),
  ('🥤 Limonata',            'Taze sıkılmış limon, nane ve soda ile',                                55.00,  'İçecekler',     ARRAY[]::TEXT[],                   9),
  ('🫖 Bitki Çayı',          'Adaçayı, ıhlamur veya papatya seçenekleri',                            40.00,  'İçecekler',     ARRAY[]::TEXT[],                  10)
ON CONFLICT DO NOTHING;

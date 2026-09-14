/*
# Create Canary restaurant menu items

1. New Tables
- `menu_items` stores dishes and drinks shown on the public menu.
- `id` uniquely identifies each menu item.
- `name` is the public item name.
- `description` is the public item description.
- `category` groups items into menu sections.
- `price` stores the displayed price in Ethiopian birr.
- `image_url` optionally stores a public image path.
- `is_available` controls whether an item is shown publicly.
- `sort_order` controls the order within a section.
- `user_id` identifies the signed-in admin who owns an edited item.
- `created_at` and `updated_at` track changes.

2. Security
- Row level security is enabled.
- Public visitors can read available items.
- Signed-in admins can create items they own.
- Signed-in admins can edit unclaimed seed items or items they own.
- Signed-in admins can delete only items they own.

3. Important Notes
- Seed items are intentionally unclaimed so the first admin can personalize them.
- Prices are stored as numeric values and displayed with Ethiopian birr.
*/

CREATE TABLE IF NOT EXISTS public.menu_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text NOT NULL DEFAULT '',
  category text NOT NULL DEFAULT 'Kitchen',
  price numeric(10,2) NOT NULL DEFAULT 0,
  image_url text,
  is_available boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.menu_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view available menu items" ON public.menu_items;
CREATE POLICY "Public can view available menu items"
  ON public.menu_items FOR SELECT
  TO anon, authenticated
  USING (is_available = true OR auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can create menu items" ON public.menu_items;
CREATE POLICY "Admins can create menu items"
  ON public.menu_items FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can update menu items" ON public.menu_items;
CREATE POLICY "Admins can update menu items"
  ON public.menu_items FOR UPDATE
  TO authenticated
  USING (user_id IS NULL OR auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can delete owned menu items" ON public.menu_items;
CREATE POLICY "Admins can delete owned menu items"
  ON public.menu_items FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS menu_items_category_sort_idx
  ON public.menu_items (category, sort_order);

INSERT INTO public.menu_items (name, description, category, price, sort_order)
SELECT * FROM (VALUES
  ('Fiyel Kurt', 'Tender beef cubes, bright peppers, and house spices served with warm injera.', 'Canary signatures', 480.00, 1),
  ('Fish Tibs', 'Sizzling pan-seared fish with rosemary, lemon, and a little Canary heat.', 'Canary signatures', 560.00, 2),
  ('Aasa Lebleb', 'Crisp, golden fish bites with fresh herbs and a cool house dip.', 'From the kitchen', 420.00, 3),
  ('Aasa Tibit', 'Ethiopian-style fish sauté with onions, peppers, and fragrant butter.', 'From the kitchen', 520.00, 4),
  ('St. George Draft', 'A bright, crisp Ethiopian lager poured cold from the tap.', 'At the bar', 180.00, 5),
  ('Canary Old Fashioned', 'A slow-sipping pour with orange, bitters, and a warm finish.', 'At the bar', 420.00, 6)
) AS seed(name, description, category, price, sort_order)
WHERE NOT EXISTS (SELECT 1 FROM public.menu_items);

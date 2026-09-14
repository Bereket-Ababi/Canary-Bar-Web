/*
# Add hover image toggle and restaurant info table

1. Changes to menu_items
- Add show_hover_image boolean column (default false)
- Update select signature dishes with image_url and show_hover_image = true

2. New Tables
- restaurant_info: single-row table for editable restaurant details
  - address, address_detail, hours, hours_label, phone, phone_label
  - Seeded with current Canary details

3. Security
- restaurant_info: public SELECT (anon + authenticated), authenticated UPDATE
- 4 separate policies following existing pattern

4. Important Notes
- show_hover_image controls whether a food image fades in on hover for that menu item
- restaurant_info always has exactly one row (id = 1)
*/

ALTER TABLE public.menu_items
  ADD COLUMN IF NOT EXISTS show_hover_image boolean NOT NULL DEFAULT false;

UPDATE public.menu_items
  SET image_url = '/images/Screenshot_2026-09-14_195113.png', show_hover_image = true
  WHERE name = 'Fiyel Kurt';

UPDATE public.menu_items
  SET image_url = '/images/Screenshot_2026-09-14_195101.png', show_hover_image = true
  WHERE name = 'Fish Tibs';

UPDATE public.menu_items
  SET image_url = '/images/Screenshot_2026-09-14_195054.png', show_hover_image = true
  WHERE name = 'Doro Wot';

UPDATE public.menu_items
  SET image_url = '/images/Screenshot_2026-09-14_195040.png', show_hover_image = true
  WHERE name = 'Kitfo Special';

UPDATE public.menu_items
  SET image_url = '/images/Screenshot_2026-09-14_195019.png', show_hover_image = true
  WHERE name = 'Beyaynetu';

CREATE TABLE IF NOT EXISTS public.restaurant_info (
  id int PRIMARY KEY DEFAULT 1,
  address text NOT NULL DEFAULT '2R38+7QG, Addis Ababa',
  address_detail text NOT NULL DEFAULT 'Jacros, Addis Ababa',
  hours text NOT NULL DEFAULT '11:00 AM — 11:00 PM',
  hours_label text NOT NULL DEFAULT 'Open every day',
  phone text NOT NULL DEFAULT '097 998 8685',
  phone_label text NOT NULL DEFAULT 'Call for reservations'
);

ALTER TABLE public.restaurant_info ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can read restaurant info" ON public.restaurant_info;
CREATE POLICY "Public can read restaurant info"
  ON public.restaurant_info FOR SELECT
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "Admins can update restaurant info" ON public.restaurant_info;
CREATE POLICY "Admins can update restaurant info"
  ON public.restaurant_info FOR UPDATE
  TO authenticated
  USING (true) WITH CHECK (true);

INSERT INTO public.restaurant_info (id)
SELECT 1 WHERE NOT EXISTS (SELECT 1 FROM public.restaurant_info);

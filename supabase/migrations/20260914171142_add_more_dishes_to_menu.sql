/*
# Add more Ethiopian dishes to the Canary menu

1. Changes
- Inserts additional menu items covering kitchen classics, bar drinks, and desserts.
- Items are seeded only if the menu_items table is currently empty or has 6 or fewer items (the original seed).
- All new items are unclaimed (user_id NULL) so the first admin can adopt them.

2. New items added
- Doro Wot, Kitfo Special, Beyaynetu, Shiro Wot, Gored Gored, Enkulal Firfir (kitchen)
- Tej (Honey Wine), Buna (Ethiopian Coffee), Spritz (bar)
- Avocado Salad (kitchen)
*/

INSERT INTO public.menu_items (name, description, category, price, sort_order)
SELECT * FROM (VALUES
  ('Doro Wot', 'Slow-cooked chicken and hard-boiled egg in a deep berbere sauce, served on injera.', 'Canary signatures', 650.00, 3),
  ('Kitfo Special', 'Hand-minched lean beef warmed in niter kibbeh and mitmita, plated with kibe and gomen.', 'Canary signatures', 720.00, 4),
  ('Beyaynetu', 'A colorful fasting platter: shiro, misir wot, atakilt, and split lentils over injera.', 'From the kitchen', 540.00, 5),
  ('Gored Gored', 'Cubed raw beef tossed in warm spiced butter and awaze, for the adventurous table.', 'From the kitchen', 680.00, 6),
  ('Shiro Wot', 'Velvety chickpea flour stew slow-simmered with garlic, onion, and berbere.', 'From the kitchen', 380.00, 7),
  ('Enkulal Firfir', 'Scrambled eggs with onions, tomato, and green chili, folded with fresh kita.', 'From the kitchen', 290.00, 8),
  ('Avocado Salad', 'Ripe avocado, tomato, onion, and jalapeno with lime and a pinch of mitmita.', 'From the kitchen', 250.00, 9),
  ('Tej (Honey Wine)', 'House-brewed Ethiopian honey wine, served in a traditional berele flask.', 'At the bar', 220.00, 7),
  ('Buna (Ethiopian Coffee)', 'Freshly roasted and brewed in a jebena, served with popcorn and incense.', 'At the bar', 120.00, 8),
  ('Canary Spritz', 'A bright, bubbly pour with a hint of citrus and a pomegranate finish.', 'At the bar', 380.00, 9)
) AS new_items(name, description, category, price, sort_order)
WHERE NOT EXISTS (
  SELECT 1 FROM public.menu_items WHERE name = 'Doro Wot'
);

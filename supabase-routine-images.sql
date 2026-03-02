-- ─── Añadir imágenes a las rutinas ───────────────────────────────────────────
-- Ejecuta esto en Supabase → SQL Editor

-- GYM
UPDATE routines SET image_url = 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&q=80'
WHERE id = '11111111-0000-0000-0000-000000000001'; -- Full Body Principiante

UPDATE routines SET image_url = 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=800&q=80'
WHERE id = '11111111-0000-0000-0000-000000000002'; -- Hipertrofia Tren Superior

UPDATE routines SET image_url = 'https://images.unsplash.com/photo-1574680096145-d05b474e2155?w=800&q=80'
WHERE id = '11111111-0000-0000-0000-000000000003'; -- Lower Body Power

-- YOGA
UPDATE routines SET image_url = 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=800&q=80'
WHERE id = '22222222-0000-0000-0000-000000000001'; -- Yoga Matutino 20min

UPDATE routines SET image_url = 'https://images.unsplash.com/photo-1588286840104-8957b019727f?w=800&q=80'
WHERE id = '22222222-0000-0000-0000-000000000002'; -- Yoga para Flexibilidad

UPDATE routines SET image_url = 'https://images.unsplash.com/photo-1545389336-cf090694435e?w=800&q=80'
WHERE id = '22222222-0000-0000-0000-000000000003'; -- Yoga Restaurativo

-- PILATES
UPDATE routines SET image_url = 'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=800&q=80'
WHERE id = '33333333-0000-0000-0000-000000000001'; -- Core Pilates Básico

UPDATE routines SET image_url = 'https://images.unsplash.com/photo-1571945153237-4929e783af4a?w=800&q=80'
WHERE id = '33333333-0000-0000-0000-000000000002'; -- Pilates Reformer Style

UPDATE routines SET image_url = 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=800&q=80'
WHERE id = '33333333-0000-0000-0000-000000000003'; -- Pilates Power Flow

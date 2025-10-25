ALTER TABLE users ADD COLUMN role user_role NOT NULL DEFAULT 'client';

-- Попытаемся восстановить роли на основе имеющихся данных
-- Админ всегда один
UPDATE users SET role = 'admin' WHERE email = 'admin@gmail.com';

-- Мастера - те, у кого есть bio или опыт
UPDATE users u SET role = 'master'
FROM user_details ud
WHERE u.id = ud.user_id AND (ud.bio IS NOT NULL OR ud.years_of_experience IS NOT NULL);

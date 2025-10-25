-- Откат миграции 000003_create_default_admin

-- Удаляем дефолтного администратора из user_details
DELETE FROM user_details WHERE user_id = (SELECT id FROM users WHERE email = 'admin@gmail.com');

-- Удаляем дефолтного администратора из users
DELETE FROM users WHERE email = 'admin@gmail.com';

-- Удаляем столбец is_admin из таблицы user_details
ALTER TABLE user_details
DROP COLUMN is_admin;

-- Добавляем столбец is_admin в таблицу user_details
ALTER TABLE user_details
ADD COLUMN is_admin BOOLEAN NOT NULL DEFAULT FALSE;

-- Удаляем существующего пользователя admin@gmail.com, если он есть, чтобы избежать конфликтов
DELETE FROM user_details WHERE user_id = (SELECT id FROM users WHERE email = 'admin@gmail.com');
DELETE FROM users WHERE email = 'admin@gmail.com';

-- Вставляем дефолтного администратора
INSERT INTO users (id, email, password_hash)
VALUES (uuid_generate_v4(), 'admin@gmail.com', '$2a$10$/qM1OfqufpATkwHGvjV5FOhA8fzt.z9Gc9zk5BFAxOvIVTkiC9IPa');

-- Получаем ID только что вставленного пользователя
INSERT INTO user_details (user_id, first_name, is_admin)
SELECT id, 'admin', TRUE
FROM users
WHERE email = 'admin@gmail.com';

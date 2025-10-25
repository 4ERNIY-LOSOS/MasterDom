BEGIN;

-- Создаем пользователя с ролью 'admin'
-- Пароль: "admin"
INSERT INTO users (email, password_hash, role)
VALUES ('admin@gmail.com', '$2a$10$/qM1OfqufpATkwHGvjV5FOhA8fzt.z9Gc9zk5BFAxOvIVTkiC9IPa', 'admin');

-- Добавляем детали для админа
INSERT INTO user_details (user_id, first_name)
SELECT id, 'Admin'
FROM users
WHERE email = 'admin@gmail.com';

COMMIT;

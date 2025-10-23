-- Создаем новую таблицу user_details, объединяющую данные клиентов и мастеров
CREATE TABLE user_details (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100),
    phone_number VARCHAR(20),
    bio TEXT, -- Поле для мастеров, может быть NULL
    years_of_experience INT, -- Поле для мастеров, может быть NULL
    average_rating NUMERIC(3, 2) DEFAULT 0.00, -- Поле для мастеров, может быть NULL
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Переносим данные из client_profiles в user_details
INSERT INTO user_details (user_id, first_name, last_name, phone_number, created_at, updated_at)
SELECT user_id, first_name, last_name, phone_number, NOW(), NOW()
FROM client_profiles;

-- Переносим данные из master_profiles в user_details
INSERT INTO user_details (user_id, first_name, last_name, phone_number, bio, years_of_experience, average_rating, created_at, updated_at)
SELECT user_id, first_name, last_name, phone_number, bio, years_of_experience, average_rating, NOW(), NOW()
FROM master_profiles;

-- Удаляем старые таблицы профилей
DROP TABLE client_profiles;
DROP TABLE master_profiles;

-- Удаляем столбец 'role' из таблицы users
ALTER TABLE users DROP COLUMN role;

-- Триггер для автоматического обновления updated_at для user_details
CREATE TRIGGER update_user_details_updated_at BEFORE UPDATE ON user_details FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

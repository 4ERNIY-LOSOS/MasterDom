-- Откат миграции 000002_unify_user_profiles

-- Добавляем столбец 'role' обратно в таблицу users
ALTER TABLE users ADD COLUMN role user_role NOT NULL DEFAULT 'client';

-- Создаем таблицы client_profiles и master_profiles заново
CREATE TABLE client_profiles (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100),
    phone_number VARCHAR(20)
);

CREATE TABLE master_profiles (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100),
    phone_number VARCHAR(20),
    bio TEXT,
    years_of_experience INT,
    average_rating NUMERIC(3, 2) DEFAULT 0.00
);

-- Удаляем триггер для user_details
DROP TRIGGER IF EXISTS update_user_details_updated_at ON user_details;

-- Удаляем таблицу user_details
DROP TABLE user_details;

-- ВНИМАНИЕ: Данные из user_details НЕ будут автоматически восстановлены в client_profiles и master_profiles.
-- Этот скрипт предназначен для отката схемы, а не для полного восстановления данных.

-- Удаляем триггеры
DROP TRIGGER IF EXISTS update_jobs_updated_at ON jobs;
DROP TRIGGER IF EXISTS update_offers_updated_at ON offers;
DROP TRIGGER IF EXISTS update_users_updated_at ON users;

-- Удаляем функцию
DROP FUNCTION IF EXISTS update_updated_at_column();

-- Удаляем таблицы в обратном порядке из-за зависимостей FOREIGN KEY
DROP TABLE IF EXISTS chat_messages;
DROP TABLE IF EXISTS chats;
DROP TABLE IF EXISTS jobs;
DROP TABLE IF EXISTS offers;
DROP TABLE IF EXISTS service_categories;
DROP TABLE IF EXISTS master_profiles;
DROP TABLE IF EXISTS client_profiles;
DROP TABLE IF EXISTS users;

-- Удаляем перечисляемые типы
DROP TYPE IF EXISTS offer_type;
DROP TYPE IF EXISTS request_status;
DROP TYPE IF EXISTS user_role;

-- Расширения обычно не удаляют в down-миграции, так как они могут использоваться другими частями системы.
-- DROP EXTENSION IF EXISTS "uuid-ossp";

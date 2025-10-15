-- ВАЖНО: Эта миграция приведет к потере данных UUID и не сможет восстановить старые числовые ID.
-- В реальном проекте даунгрейд такой миграции был бы очень рискованным.

-- Удаляем PRIMARY KEY constraint, основанный на UUID
ALTER TABLE jobs DROP CONSTRAINT jobs_pkey;

-- Создаем новую последовательность для генерации числовых ID
CREATE SEQUENCE jobs_id_seq;

-- Меняем тип колонки обратно на INTEGER и используем новую последовательность.
ALTER TABLE jobs ALTER COLUMN id TYPE INTEGER USING (nextval('jobs_id_seq'));

-- Устанавливаем значение по умолчанию для будущих вставок
ALTER TABLE jobs ALTER COLUMN id SET DEFAULT nextval('jobs_id_seq');

-- Возвращаем PRIMARY KEY
ALTER TABLE jobs ADD PRIMARY KEY (id);

-- Устанавливаем владение последовательностью
ALTER SEQUENCE jobs_id_seq OWNED BY jobs.id;

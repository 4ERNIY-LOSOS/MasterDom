-- Удаляем старый PRIMARY KEY constraint, чтобы можно было изменить колонку
ALTER TABLE jobs DROP CONSTRAINT jobs_pkey;

-- Устанавливаем UUID в качестве типа по умолчанию для колонки id
ALTER TABLE jobs ALTER COLUMN id SET DEFAULT gen_random_uuid();

-- Меняем тип колонки ID с SERIAL (по сути, integer) на UUID.
-- Мы используем gen_random_uuid() для генерации новых UUID для существующих записей.
ALTER TABLE jobs ALTER COLUMN id TYPE UUID USING (gen_random_uuid());

-- Устанавливаем новый PRIMARY KEY на колонку id
ALTER TABLE jobs ADD PRIMARY KEY (id);

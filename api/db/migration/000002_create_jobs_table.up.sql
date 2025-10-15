CREATE TYPE job_status AS ENUM ('open', 'assigned', 'in_progress', 'completed', 'cancelled');

CREATE TABLE jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    master_id UUID REFERENCES users(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    status job_status NOT NULL DEFAULT 'open',
    location_lat NUMERIC(10, 7),
    location_lon NUMERIC(10, 7),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Добавляем индексы для ускорения поиска по часто используемым колонкам
CREATE INDEX ON jobs (client_id);
CREATE INDEX ON jobs (master_id);
CREATE INDEX ON jobs (status);

CREATE TYPE job_status AS ENUM ('open', 'in_progress', 'completed', 'cancelled');

CREATE TABLE jobs (
    id SERIAL PRIMARY KEY,
    client_id UUID NOT NULL,
    master_id UUID,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    status job_status NOT NULL DEFAULT 'open',
    location_lat DECIMAL(9, 6),
    location_lon DECIMAL(9, 6),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (client_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (master_id) REFERENCES users(id) ON DELETE SET NULL
);
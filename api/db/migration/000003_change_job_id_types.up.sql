ALTER TABLE jobs
ALTER COLUMN client_id TYPE UUID USING (gen_random_uuid()),
ALTER COLUMN master_id TYPE UUID USING (gen_random_uuid());

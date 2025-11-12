ALTER TABLE offers DROP COLUMN status;

DROP TRIGGER IF EXISTS update_offer_responses_updated_at ON offer_responses;
DROP TABLE IF EXISTS offer_responses;
DROP TYPE IF EXISTS response_status;

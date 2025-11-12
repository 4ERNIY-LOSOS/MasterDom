CREATE TYPE response_status AS ENUM ('pending', 'accepted', 'rejected');

CREATE TABLE offer_responses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    offer_id UUID NOT NULL REFERENCES offers(id) ON DELETE CASCADE,
    applicant_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    message TEXT,
    status response_status NOT NULL DEFAULT 'pending',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(offer_id, applicant_id) -- Один пользователь может откликнуться на одно объявление только один раз
);

CREATE INDEX ON offer_responses (offer_id);
CREATE INDEX ON offer_responses (applicant_id);

CREATE TRIGGER update_offer_responses_updated_at BEFORE UPDATE ON offer_responses FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE offers ADD COLUMN status request_status NOT NULL DEFAULT 'open';

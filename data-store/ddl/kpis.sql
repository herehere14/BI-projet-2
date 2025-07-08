CREATE TABLE IF NOT EXISTS kpi (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES company(id),
    metric VARCHAR(100) NOT NULL,
    value DOUBLE PRECISION NOT NULL,
    target DOUBLE PRECISION,
    as_of TIMESTAMP WITH TIME ZONE NOT NULL,
    type VARCHAR(32) NOT NULL,
    unit VARCHAR(20),
    description TEXT
);

CREATE INDEX IF NOT EXISTS idx_kpi_as_of ON kpi (as_of);
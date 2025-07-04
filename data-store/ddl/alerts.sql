CREATE TABLE IF NOT EXISTS alerts (
    id          SERIAL PRIMARY KEY,
    ts          TIMESTAMP NOT NULL,
    severity    VARCHAR(16),
    headline    TEXT,
    kpi         VARCHAR(64),
    suggested_action JSONB
);
